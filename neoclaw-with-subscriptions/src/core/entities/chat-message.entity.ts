export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** Base64 data URL of a recorded voice message (WebM audio) */
  audioDataUrl?: string;
}

export type ConnectionStatus = 'idle' | 'streaming' | 'error';

/** Wire format for the OpenAI-compatible Chat Completions API */
export interface OpenAIChatMessage {
  role: string;
  content: string;
}
