import type { ExtensionSettings } from '../entities';
import type { ISettingsRepository } from '../interfaces';

export class UpdateSettingsUseCase {
  constructor(private repository: ISettingsRepository) {}

  async execute(updates: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.repository.getSettings();

    const merged: Partial<ExtensionSettings> = {
      ...updates,
      updatedAt: Date.now(),
      version: current.version,
    };

    return await this.repository.updateSettings(merged);
  }
}
