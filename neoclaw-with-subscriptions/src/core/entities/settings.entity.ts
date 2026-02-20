export interface ExtensionSettings {
  version: string;
  enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  debugMode: boolean;
  customOptions: Record<string, unknown>;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  version: '1.0.0',
  enabled: true,
  theme: 'auto',
  notifications: true,
  debugMode: false,
  customOptions: {},
  updatedAt: Date.now(),
};
