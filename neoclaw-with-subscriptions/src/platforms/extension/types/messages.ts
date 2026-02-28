import type { ExtensionSettings } from '@/core';

// ── Settings & subscription messages (runtime.sendMessage) ──

export enum MessageType {
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  RESET_SETTINGS = 'RESET_SETTINGS',
  GET_SUBSCRIPTION_REPORT = 'GET_SUBSCRIPTION_REPORT',
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

export interface GetSubscriptionReportRequest {
  type: MessageType.GET_SUBSCRIPTION_REPORT;
}

export type ExtensionMessage =
  | GetSettingsRequest
  | UpdateSettingsRequest
  | ResetSettingsRequest
  | GetSubscriptionReportRequest;

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
