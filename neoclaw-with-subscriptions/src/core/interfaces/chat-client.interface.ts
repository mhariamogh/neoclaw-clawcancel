import type { OpenAIChatMessage } from '../entities';

export interface SendMessageOptions {
  messages: OpenAIChatMessage[];
  onChunk: (text: string) => void;
  sessionId?: string;
  /** Base64 data URL of an audio recording attached to the latest user message */
  audioDataUrl?: string;
}

export interface IChatClient {
  setGatewayConfig(baseUrl: string, authToken: string): void;
  sendMessage(options: SendMessageOptions): Promise<void>;
  abort(): void;
}
