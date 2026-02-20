import type { ExtensionSettings } from '../entities';

export interface ISettingsRepository {
  getSettings(): Promise<ExtensionSettings>;
  updateSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings>;
  resetSettings(): Promise<ExtensionSettings>;
}
