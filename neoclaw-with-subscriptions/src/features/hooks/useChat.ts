import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatSessionSummary, ConnectionStatus } from '@/core';
import { CHAT_PORT_NAME, ChatPortMessageType } from '@/platforms/extension/types';
import type { ChatPortMessage } from '@/platforms/extension/types';

interface UseChatReturn {
  messages: ChatMessage[];
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  status: ConnectionStatus;
  isStreaming: boolean;
  sendMessage: (text: string, audioDataUrl?: string) => void;
  abortStream: () => void;
  clearSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  refreshSessions: () => void;
  refreshMessages: () => void;
}

const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const KEEPALIVE_INTERVAL_MS = 25_000;

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [isStreaming, setIsStreaming] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const sessionLoadedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStreamingRef = useRef(false);
  const unmountedRef = useRef(false);

  // Keep isStreamingRef in sync so the onDisconnect closure reads the latest value
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    unmountedRef.current = false;

    const connectPort = () => {
      const port = chrome.runtime.connect({ name: CHAT_PORT_NAME });
      portRef.current = port;

      port.onMessage.addListener((message: ChatPortMessage) => {
        // Any successful message means the connection is healthy
        reconnectAttemptsRef.current = 0;

        switch (message.type) {
          case ChatPortMessageType.CHAT_STATUS:
            setStatus(message.status);
            break;

          case ChatPortMessageType.CHAT_HISTORY_LOADED:
            setMessages(message.messages);
            setCurrentSessionId(message.sessionId);
            sessionLoadedRef.current = true;
            break;

          case ChatPortMessageType.CHAT_SESSIONS_LIST:
            setSessions(message.sessions);
            break;

          case ChatPortMessageType.CHAT_STREAM_CHUNK:
            handleStreamChunk(message.content);
            break;

          case ChatPortMessageType.CHAT_STREAM_DONE:
            handleStreamDone();
            break;

          case ChatPortMessageType.CHAT_STREAM_ERROR:
            handleStreamError(message.error);
            break;
        }
      });

      port.onDisconnect.addListener(() => {
        portRef.current = null;
        sessionLoadedRef.current = false;
        clearKeepAlive();

        // Don't reconnect if the component has unmounted
        if (unmountedRef.current) return;

        // If streaming was in progress, the stream is unrecoverable
        if (isStreamingRef.current) {
          setIsStreaming(false);
          handleStreamError('Connection lost during streaming');
          return;
        }

        // Attempt silent reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          setTimeout(connectPort, RECONNECT_DELAY_MS);
        } else {
          setStatus('error');
        }
      });

      // Start keep-alive heartbeat
      clearKeepAlive();
      keepAliveIntervalRef.current = setInterval(() => {
        try {
          portRef.current?.postMessage({ type: ChatPortMessageType.CHAT_PING });
        } catch {
          // Port already disconnected, interval will be cleared by onDisconnect
        }
      }, KEEPALIVE_INTERVAL_MS);

      // Request the session list on connect
      port.postMessage({ type: ChatPortMessageType.CHAT_GET_SESSIONS });
    };

    const clearKeepAlive = () => {
      if (keepAliveIntervalRef.current !== null) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };

    connectPort();

    return () => {
      unmountedRef.current = true;
      clearKeepAlive();
      portRef.current?.disconnect();
      portRef.current = null;
      sessionLoadedRef.current = false;
    };
  }, []);

  const handleStreamChunk = (content: string) => {
    setMessages((prev) => {
      const currentId = streamingMessageIdRef.current;

      if (!currentId) {
        // Create a new assistant message
        const newId = crypto.randomUUID();
        streamingMessageIdRef.current = newId;
        return [
          ...prev,
          { id: newId, role: 'assistant' as const, content, timestamp: Date.now() },
        ];
      }

      // Append to existing assistant message
      return prev.map((msg) =>
        msg.id === currentId ? { ...msg, content: msg.content + content } : msg,
      );
    });
  };

  const handleStreamDone = () => {
    streamingMessageIdRef.current = null;
    setIsStreaming(false);

    // Refresh session list to update titles / timestamps
    portRef.current?.postMessage({ type: ChatPortMessageType.CHAT_GET_SESSIONS });
  };

  const handleStreamError = (error: string) => {
    streamingMessageIdRef.current = null;
    setIsStreaming(false);

    // Add error as a system message
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'system' as const,
        content: `Error: ${error}`,
        timestamp: Date.now(),
      },
    ]);
  };

  const sendMessage = useCallback((text: string, audioDataUrl?: string) => {
    const trimmed = text.trim();
    if (!trimmed || !portRef.current || !sessionLoadedRef.current) return;

    // Add user message to local state immediately for responsiveness
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: trimmed,
        timestamp: Date.now(),
        ...(audioDataUrl ? { audioDataUrl } : {}),
      },
    ]);

    setIsStreaming(true);

    portRef.current.postMessage({
      type: ChatPortMessageType.CHAT_SEND,
      text: trimmed,
      ...(audioDataUrl ? { audioDataUrl } : {}),
    });
  }, []);

  const abortStream = useCallback(() => {
    if (!portRef.current || !isStreamingRef.current) return;
    portRef.current.postMessage({ type: ChatPortMessageType.CHAT_ABORT });
  }, []);

  const clearSession = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    streamingMessageIdRef.current = null;
    sessionLoadedRef.current = false;

    portRef.current?.postMessage({
      type: ChatPortMessageType.CHAT_NEW_SESSION,
    });

    // Refresh session list after creating a new session
    setTimeout(() => {
      portRef.current?.postMessage({ type: ChatPortMessageType.CHAT_GET_SESSIONS });
    }, 100);
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    if (!portRef.current) return;

    setMessages([]);
    setIsStreaming(false);
    streamingMessageIdRef.current = null;
    sessionLoadedRef.current = false;

    portRef.current.postMessage({
      type: ChatPortMessageType.CHAT_SWITCH_SESSION,
      sessionId,
    });
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    if (!portRef.current) return;

    portRef.current.postMessage({
      type: ChatPortMessageType.CHAT_DELETE_SESSION,
      sessionId,
    });
  }, []);

  const refreshSessions = useCallback(() => {
    portRef.current?.postMessage({ type: ChatPortMessageType.CHAT_GET_SESSIONS });
  }, []);

  const refreshMessages = useCallback(() => {
    portRef.current?.postMessage({ type: ChatPortMessageType.CHAT_REFRESH_HISTORY });
  }, []);

  return {
    messages,
    sessions,
    currentSessionId,
    status,
    isStreaming,
    sendMessage,
    abortStream,
    clearSession,
    switchSession,
    deleteSession,
    refreshSessions,
    refreshMessages,
  };
}
