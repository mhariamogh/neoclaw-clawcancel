import type {
  IAuthRepository,
  IChatClient,
  IChatRepository,
  OpenAIChatMessage,
  SendMessageOptions,
} from '@/core';
import { CHAT_PORT_NAME, ChatPortMessageType } from '../../types';
import type { ChatPortMessage } from '../../types';
import { SubscriptionChatMiddleware } from '../middleware/subscription-chat.middleware';

export class ChatPortListener {
  private conversationHistory: OpenAIChatMessage[] = [];
  private currentSessionId: string | null = null;

  constructor(
    private chatClient: IChatClient,
    private chatRepository: IChatRepository,
    private authRepository: IAuthRepository,
    private subscriptionMiddleware?: SubscriptionChatMiddleware,
  ) {}

  register(): void {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== CHAT_PORT_NAME) return;

      this.sendStatus(port, 'idle');
      this.loadCurrentSession(port);

      port.onMessage.addListener((message: ChatPortMessage) => {
        switch (message.type) {
          case ChatPortMessageType.CHAT_SEND:
            this.handleChatSend(port, message.text, message.audioDataUrl);
            break;
          case ChatPortMessageType.CHAT_NEW_SESSION:
            this.handleNewSession(port);
            break;
          case ChatPortMessageType.CHAT_SWITCH_SESSION:
            this.handleSwitchSession(port, message.sessionId);
            break;
          case ChatPortMessageType.CHAT_GET_SESSIONS:
            this.handleGetSessions(port);
            break;
          case ChatPortMessageType.CHAT_REFRESH_HISTORY:
            this.loadCurrentSession(port);
            break;
          case ChatPortMessageType.CHAT_DELETE_SESSION:
            this.handleDeleteSession(port, message.sessionId);
            break;
          case ChatPortMessageType.CHAT_ABORT:
            this.handleAbort(port);
            break;
          case ChatPortMessageType.CHAT_PING:
            // No-op: keeps the service worker alive
            break;
        }
      });
    });
  }

  /** Load the most recent (or new) session and send its history to the UI */
  private async loadCurrentSession(port: chrome.runtime.Port): Promise<void> {
    try {
      const session = await this.chatRepository.getOrCreateCurrentSession();
      this.currentSessionId = session.id;

      // Rebuild the conversation history for the API from persisted messages
      this.conversationHistory = session.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      this.postMessage(port, {
        type: ChatPortMessageType.CHAT_HISTORY_LOADED,
        sessionId: session.id,
        messages: session.messages,
      });
    } catch (error) {
      console.error('[ClawCancel] Failed to load chat session:', error);
    }
  }

  private async handleNewSession(port: chrome.runtime.Port): Promise<void> {
    try {
      const session = await this.chatRepository.createSession();
      this.currentSessionId = session.id;
      this.conversationHistory = [];

      this.postMessage(port, {
        type: ChatPortMessageType.CHAT_HISTORY_LOADED,
        sessionId: session.id,
        messages: [],
      });
      this.sendStatus(port, 'idle');
    } catch (error) {
      console.error('[ClawCancel] Failed to create new session:', error);
      this.sendStatus(port, 'error');
    }
  }

  private async handleSwitchSession(port: chrome.runtime.Port, sessionId: string): Promise<void> {
    try {
      const session = await this.chatRepository.getSession(sessionId);
      if (!session) {
        this.postMessage(port, {
          type: ChatPortMessageType.CHAT_STREAM_ERROR,
          error: 'Session not found',
        });
        return;
      }

      this.currentSessionId = session.id;
      this.conversationHistory = session.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      this.postMessage(port, {
        type: ChatPortMessageType.CHAT_HISTORY_LOADED,
        sessionId: session.id,
        messages: session.messages,
      });
      this.sendStatus(port, 'idle');
    } catch (error) {
      console.error('[ClawCancel] Failed to switch session:', error);
      this.sendStatus(port, 'error');
    }
  }

  private async handleGetSessions(port: chrome.runtime.Port): Promise<void> {
    try {
      const sessions = await this.chatRepository.getSessions();
      this.postMessage(port, {
        type: ChatPortMessageType.CHAT_SESSIONS_LIST,
        sessions,
      });
    } catch (error) {
      console.error('[ClawCancel] Failed to get sessions:', error);
    }
  }

  private async handleDeleteSession(port: chrome.runtime.Port, sessionId: string): Promise<void> {
    try {
      await this.chatRepository.deleteSession(sessionId);

      // If we deleted the current session, switch to a new one
      if (sessionId === this.currentSessionId) {
        await this.handleNewSession(port);
      }

      // Send updated session list
      await this.handleGetSessions(port);
    } catch (error) {
      console.error('[ClawCancel] Failed to delete session:', error);
    }
  }

  private async handleChatSend(
    port: chrome.runtime.Port,
    text: string,
    audioDataUrl?: string,
  ): Promise<void> {
    // Enrich message with subscription context if relevant
    const enrichedText = this.subscriptionMiddleware 
      ? await this.subscriptionMiddleware.enrichMessage(text)
      : text;

    // Persist the ORIGINAL user message (not enriched)
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
      ...(audioDataUrl ? { audioDataUrl } : {}),
    };

    if (this.currentSessionId) {
      await this.chatRepository.addMessage(this.currentSessionId, userMessage);
    }

    // Use ENRICHED text for AI conversation
    this.conversationHistory.push({ role: 'user', content: enrichedText });
    this.sendStatus(port, 'streaming');

    let assistantContent = '';

    try {
      await this.configureChatClientFromAuth();

      const sendOptions: SendMessageOptions = {
        messages: [...this.conversationHistory],
        onChunk: (chunk: string) => {
          assistantContent += chunk;
          this.postMessage(port, {
            type: ChatPortMessageType.CHAT_STREAM_CHUNK,
            content: chunk,
          });
        },
        sessionId: this.currentSessionId ?? undefined,
        audioDataUrl,
      };

      await this.chatClient.sendMessage(sendOptions);

      this.conversationHistory.push({ role: 'assistant', content: assistantContent });

      // Persist the assistant message
      if (this.currentSessionId) {
        await this.chatRepository.addMessage(this.currentSessionId, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          timestamp: Date.now(),
        });
      }

      this.postMessage(port, { type: ChatPortMessageType.CHAT_STREAM_DONE });
      this.sendStatus(port, 'idle');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Persist any partial content that was streamed before the abort
        if (assistantContent && this.currentSessionId) {
          this.conversationHistory.push({ role: 'assistant', content: assistantContent });
          await this.chatRepository.addMessage(this.currentSessionId, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
          });
        }
        this.postMessage(port, { type: ChatPortMessageType.CHAT_STREAM_DONE });
        this.sendStatus(port, 'idle');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.postMessage(port, {
        type: ChatPortMessageType.CHAT_STREAM_ERROR,
        error: errorMessage,
      });
      this.sendStatus(port, 'error');
    }
  }

  private handleAbort(port: chrome.runtime.Port): void {
    this.chatClient.abort();
  }

  private async configureChatClientFromAuth(): Promise<void> {
    const authState = await this.authRepository.getAuthState();
    if (!authState.gatewayUrl || !authState.gatewayToken) {
      throw new Error('Gateway credentials are missing. Please sign in again.');
    }

    this.chatClient.setGatewayConfig(authState.gatewayUrl, authState.gatewayToken);
  }

  private sendStatus(port: chrome.runtime.Port, status: 'idle' | 'streaming' | 'error'): void {
    this.postMessage(port, { type: ChatPortMessageType.CHAT_STATUS, status });
  }

  /** Safely post a message, ignoring errors from disconnected ports */
  private postMessage(port: chrome.runtime.Port, message: ChatPortMessage): void {
    try {
      port.postMessage(message);
    } catch {
      // Port disconnected, ignore
    }
  }
}
