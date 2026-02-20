import type { ChatMessage } from '../entities';
import type { ChatSession, ChatSessionSummary } from '../entities';

export interface IChatRepository {
  /** Get all session summaries (without messages), newest first */
  getSessions(): Promise<ChatSessionSummary[]>;

  /** Get a full session by ID, or null if not found */
  getSession(id: string): Promise<ChatSession | null>;

  /** Create a new empty session and return it */
  createSession(): Promise<ChatSession>;

  /** Append a message to a session and persist */
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;

  /** Update the session title */
  updateTitle(sessionId: string, title: string): Promise<void>;

  /** Delete a session by ID */
  deleteSession(id: string): Promise<void>;

  /** Get the most recent session, or create one if none exist */
  getOrCreateCurrentSession(): Promise<ChatSession>;
}
