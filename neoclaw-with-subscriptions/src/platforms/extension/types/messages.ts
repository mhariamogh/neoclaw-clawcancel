import type { ChatMessage, ChatSessionSummary, ExtensionSettings } from '@/core';

// ── Settings messages (runtime.sendMessage) ──

export enum MessageType {
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  RESET_SETTINGS = 'RESET_SETTINGS',
  GET_AUTH_STATE = 'GET_AUTH_STATE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

// Request types
export interface GetSettingsRequest {
  type: MessageType.GET_SETTINGS;
}

export interface UpdateSettingsRequest {
  type: MessageType.UPDATE_SETTINGS;
  payload: Partial<ExtensionSettings>;
}

export interface ResetSettingsRequest {
  type: MessageType.RESET_SETTINGS;
}

export interface GetAuthStateRequest {
  type: MessageType.GET_AUTH_STATE;
}

export interface LoginRequest {
  type: MessageType.LOGIN;
  username: string;
  password: string;
}

export interface LogoutRequest {
  type: MessageType.LOGOUT;
}

export type ExtensionMessage =
  | GetSettingsRequest
  | UpdateSettingsRequest
  | ResetSettingsRequest
  | GetAuthStateRequest
  | LoginRequest
  | LogoutRequest;

// Response types
export interface SuccessResponse {
  success: true;
  data: unknown;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorKind?: 'error' | 'info';
}

export type ExtensionResponse = SuccessResponse | ErrorResponse;

// ── Chat port messages (runtime.connect) ──

export const CHAT_PORT_NAME = 'neoclaw-chat';

export enum ChatPortMessageType {
  CHAT_SEND = 'CHAT_SEND',
  CHAT_ABORT = 'CHAT_ABORT',
  CHAT_NEW_SESSION = 'CHAT_NEW_SESSION',
  CHAT_SWITCH_SESSION = 'CHAT_SWITCH_SESSION',
  CHAT_GET_SESSIONS = 'CHAT_GET_SESSIONS',
  CHAT_DELETE_SESSION = 'CHAT_DELETE_SESSION',
  CHAT_REFRESH_HISTORY = 'CHAT_REFRESH_HISTORY',
  CHAT_STREAM_CHUNK = 'CHAT_STREAM_CHUNK',
  CHAT_STREAM_DONE = 'CHAT_STREAM_DONE',
  CHAT_STREAM_ERROR = 'CHAT_STREAM_ERROR',
  CHAT_STATUS = 'CHAT_STATUS',
  CHAT_HISTORY_LOADED = 'CHAT_HISTORY_LOADED',
  CHAT_SESSIONS_LIST = 'CHAT_SESSIONS_LIST',
  CHAT_PING = 'CHAT_PING',
}

/** UI → Background: user sends a chat message */
export interface ChatSendMessage {
  type: ChatPortMessageType.CHAT_SEND;
  text: string;
  /** Base64 data URL of a recorded voice message, if any */
  audioDataUrl?: string;
}

/** UI → Background: clear conversation and start a new session */
export interface ChatNewSessionMessage {
  type: ChatPortMessageType.CHAT_NEW_SESSION;
}

/** UI → Background: switch to an existing session by ID */
export interface ChatSwitchSessionMessage {
  type: ChatPortMessageType.CHAT_SWITCH_SESSION;
  sessionId: string;
}

/** UI → Background: request the list of all sessions */
export interface ChatGetSessionsMessage {
  type: ChatPortMessageType.CHAT_GET_SESSIONS;
}

/** UI → Background: refresh current session history */
export interface ChatRefreshHistoryMessage {
  type: ChatPortMessageType.CHAT_REFRESH_HISTORY;
}

/** UI → Background: delete a session by ID */
export interface ChatDeleteSessionMessage {
  type: ChatPortMessageType.CHAT_DELETE_SESSION;
  sessionId: string;
}

/** UI → Background: abort the current streaming response */
export interface ChatAbortMessage {
  type: ChatPortMessageType.CHAT_ABORT;
}

/** UI → Background: keep-alive ping to prevent service worker idle timeout */
export interface ChatPingMessage {
  type: ChatPortMessageType.CHAT_PING;
}

/** Background → UI: incremental assistant content chunk */
export interface ChatStreamChunkMessage {
  type: ChatPortMessageType.CHAT_STREAM_CHUNK;
  content: string;
}

/** Background → UI: stream completed */
export interface ChatStreamDoneMessage {
  type: ChatPortMessageType.CHAT_STREAM_DONE;
}

/** Background → UI: stream error */
export interface ChatStreamErrorMessage {
  type: ChatPortMessageType.CHAT_STREAM_ERROR;
  error: string;
}

/** Background → UI: current status update */
export interface ChatStatusMessage {
  type: ChatPortMessageType.CHAT_STATUS;
  status: 'idle' | 'streaming' | 'error';
}

/** Background → UI: full chat history for the current session */
export interface ChatHistoryLoadedMessage {
  type: ChatPortMessageType.CHAT_HISTORY_LOADED;
  sessionId: string;
  messages: ChatMessage[];
}

/** Background → UI: list of all session summaries */
export interface ChatSessionsListMessage {
  type: ChatPortMessageType.CHAT_SESSIONS_LIST;
  sessions: ChatSessionSummary[];
}

export type ChatPortMessage =
  | ChatSendMessage
  | ChatAbortMessage
  | ChatNewSessionMessage
  | ChatSwitchSessionMessage
  | ChatGetSessionsMessage
  | ChatRefreshHistoryMessage
  | ChatDeleteSessionMessage
  | ChatPingMessage
  | ChatStreamChunkMessage
  | ChatStreamDoneMessage
  | ChatStreamErrorMessage
  | ChatStatusMessage
  | ChatHistoryLoadedMessage
  | ChatSessionsListMessage;
