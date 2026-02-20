import type { ChatMessage, ChatSession, ChatSessionSummary, IStorageProvider, IChatRepository } from '@/core';

const SESSIONS_INDEX_KEY = 'chat_sessions_index';
const SESSION_KEY_PREFIX = 'chat_session_';

/** Maximum number of sessions to keep in storage */
const MAX_SESSIONS = 50;

function sessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`;
}

export class ChatRepository implements IChatRepository {
  constructor(private storage: IStorageProvider) {}

  async getSessions(): Promise<ChatSessionSummary[]> {
    return this.storage.get<ChatSessionSummary[]>(SESSIONS_INDEX_KEY, []);
  }

  async getSession(id: string): Promise<ChatSession | null> {
    return this.storage.get<ChatSession | null>(sessionKey(id), null);
  }

  async createSession(): Promise<ChatSession> {
    const now = Date.now();
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    // Persist the full session
    await this.storage.set(sessionKey(session.id), session);

    // Update the index (newest first)
    const index = await this.getSessions();
    const summary: ChatSessionSummary = {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
    index.unshift(summary);

    // Prune oldest sessions if over the limit
    if (index.length > MAX_SESSIONS) {
      const removed = index.splice(MAX_SESSIONS);
      await Promise.all(removed.map((s) => this.storage.remove(sessionKey(s.id))));
    }

    await this.storage.set(SESSIONS_INDEX_KEY, index);
    return session;
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.messages.push(message);
    session.updatedAt = Date.now();

    // Auto-title from the first user message
    if (session.title === 'New Chat' && message.role === 'user') {
      session.title = message.content.slice(0, 80);
    }

    await this.storage.set(sessionKey(sessionId), session);
    await this.updateIndex(sessionId, { title: session.title, updatedAt: session.updatedAt });
  }

  async updateTitle(sessionId: string, title: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.title = title;
    session.updatedAt = Date.now();

    await this.storage.set(sessionKey(sessionId), session);
    await this.updateIndex(sessionId, { title, updatedAt: session.updatedAt });
  }

  async deleteSession(id: string): Promise<void> {
    await this.storage.remove(sessionKey(id));

    const index = await this.getSessions();
    const filtered = index.filter((s) => s.id !== id);
    await this.storage.set(SESSIONS_INDEX_KEY, filtered);
  }

  async getOrCreateCurrentSession(): Promise<ChatSession> {
    const index = await this.getSessions();

    if (index.length > 0) {
      const latest = await this.getSession(index[0].id);
      if (latest) return latest;
    }

    return this.createSession();
  }

  /** Update a single entry in the sessions index */
  private async updateIndex(
    sessionId: string,
    updates: Partial<Pick<ChatSessionSummary, 'title' | 'updatedAt'>>,
  ): Promise<void> {
    const index = await this.getSessions();
    const entry = index.find((s) => s.id === sessionId);
    if (!entry) return;

    if (updates.title !== undefined) entry.title = updates.title;
    if (updates.updatedAt !== undefined) entry.updatedAt = updates.updatedAt;

    // Move updated session to the top
    const filtered = index.filter((s) => s.id !== sessionId);
    filtered.unshift(entry);

    await this.storage.set(SESSIONS_INDEX_KEY, filtered);
  }
}
