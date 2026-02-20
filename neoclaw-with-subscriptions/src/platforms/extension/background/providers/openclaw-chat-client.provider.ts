import type { IChatClient, OpenAIChatMessage, SendMessageOptions } from '@/core';

interface OpenClawChatClientConfig {
  baseUrl: string;
  chatEndpoint: string;
  authToken: string;
  agentId: string;
  model: string;
}

/* ── /v1/responses item types ── */

interface InputTextContent {
  type: 'input_text';
  text: string;
}

interface InputFileContent {
  type: 'input_file';
  file_data: string;
  filename: string;
}

type InputContentItem = InputTextContent | InputFileContent;

interface InputMessageItem {
  type: 'message';
  role: string;
  content: string | InputContentItem[];
}

interface ResponsesRequestBody {
  model: string;
  stream: boolean;
  input: InputMessageItem[];
}

/* ── Data URL helpers ── */

/**
 * Parse a base64 data URL into its MIME type and raw base64 string.
 * Example: "data:audio/webm;codecs=opus;base64,SGVsbG8=" → { mimeType: "audio/webm;codecs=opus", base64: "SGVsbG8=" }
 */
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+(?:;[^;]+)*?);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

/** Derive a file extension from an audio MIME type */
function audioExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

/* ── Client ── */

export class OpenClawChatClient implements IChatClient {
  private abortController: AbortController | null = null;

  constructor(private config: OpenClawChatClientConfig) {}

  setBaseUrl(baseUrl: string): void {
    this.config = { ...this.config, baseUrl };
  }

  setGatewayConfig(baseUrl: string, authToken: string): void {
    this.config = { ...this.config, baseUrl, authToken };
  }

  async sendMessage({ messages, onChunk, sessionId, audioDataUrl }: SendMessageOptions): Promise<void> {
    if (!this.config.baseUrl) {
      throw new Error('Missing gateway URL. Please sign in again.');
    }
    if (!this.config.authToken) {
      throw new Error('Missing gateway token. Please sign in again.');
    }

    this.abortController = new AbortController();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.authToken}`,
      'Content-Type': 'application/json',
      'x-openclaw-agent-id': this.config.agentId,
    };

    if (sessionId) {
      headers['x-openclaw-session-key'] = sessionId;
    }

    const body = this.buildRequestBody(messages, audioDataUrl);

    const url = `${this.config.baseUrl}${this.config.chatEndpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gateway error ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    await this.readSSEStream(response.body, onChunk);
    this.abortController = null;
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /* ── Request building ── */

  /**
   * Convert the flat OpenAI-style message list into the /v1/responses
   * item-based input format. If the latest user message has audio,
   * attach it as an `input_file` content item.
   */
  private buildRequestBody(
    messages: OpenAIChatMessage[],
    audioDataUrl?: string,
  ): ResponsesRequestBody {
    const input: InputMessageItem[] = messages.map((msg, idx) => {
      const isLastUser = msg.role === 'user' && idx === messages.length - 1;

      // If this is the latest user message and has audio, build multi-part content
      if (isLastUser && audioDataUrl) {
        const contentParts: InputContentItem[] = [
          { type: 'input_text', text: msg.content },
        ];

        const parsed = parseDataUrl(audioDataUrl);
        if (parsed) {
          const mediaType = parsed.mimeType.split(';')[0].trim();
          const ext = audioExtension(parsed.mimeType);
          contentParts.push({
            type: 'input_file',
            file_data: `data:${mediaType};base64,${parsed.base64}`,
            filename: `voice-message.${ext}`,
          });
        }

        return { type: 'message', role: msg.role, content: contentParts };
      }

      // Regular text-only message
      return { type: 'message', role: msg.role, content: msg.content };
    });

    return {
      model: this.config.model,
      stream: true,
      input,
    };
  }

  /* ── SSE streaming ── */

  /**
   * Parse the /v1/responses SSE stream.
   *
   * Events arrive as:
   *   event: response.output_text.delta
   *   data: {"type":"response.output_text.delta","delta":"text chunk",...}
   *
   * Stream ends with:
   *   data: [DONE]
   *
   * Or a response.completed / response.failed event.
   */
  private async readSSEStream(
    body: ReadableStream<Uint8Array>,
    onChunk: (text: string) => void,
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Empty line = end of an SSE event block
          if (!trimmed) {
            currentEvent = '';
            continue;
          }

          // Comment line
          if (trimmed.startsWith(':')) continue;

          // Track the event type
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          // Data line – handle both "data: " and "data:" (no space)
          if (trimmed.startsWith('data:')) {
            const dataPayload = trimmed.startsWith('data: ')
              ? trimmed.slice(6)
              : trimmed.slice(5);

            if (dataPayload === '[DONE]') return;

            // Determine the effective event type: prefer the SSE `event:`
            // field, but fall back to the `type` inside the JSON payload so
            // the parser works even when the server omits `event:` lines.
            const effectiveEvent = currentEvent || this.extractType(dataPayload);

            if (effectiveEvent === 'response.output_text.delta') {
              const content = this.extractDelta(dataPayload);
              if (content) onChunk(content);
            }

            if (effectiveEvent === 'response.failed') {
              const errMsg = this.extractErrorMessage(dataPayload);
              throw new Error(errMsg || 'Response failed');
            }

            if (effectiveEvent === 'response.completed') {
              return;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /** Extract the `type` field from an SSE data payload (fallback when no `event:` line) */
  private extractType(json: string): string | null {
    try {
      const parsed = JSON.parse(json);
      return parsed?.type ?? null;
    } catch {
      return null;
    }
  }

  /** Extract the `delta` field from a response.output_text.delta event */
  private extractDelta(json: string): string | null {
    try {
      const parsed = JSON.parse(json);
      return parsed?.delta ?? null;
    } catch {
      console.warn('[ClawCancel] Failed to parse SSE delta:', json);
      return null;
    }
  }

  /** Extract an error message from a response.failed event */
  private extractErrorMessage(json: string): string | null {
    try {
      const parsed = JSON.parse(json);
      return parsed?.error?.message ?? parsed?.response?.error?.message ?? null;
    } catch {
      return null;
    }
  }

}
