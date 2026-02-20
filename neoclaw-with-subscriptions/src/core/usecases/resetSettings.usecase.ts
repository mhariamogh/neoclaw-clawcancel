import type { ExtensionSettings } from '../entities';
import type { ISettingsRepository } from '../interfaces';

export class ResetSettingsUseCase {
  constructor(private repository: ISettingsRepository) {}

  async execute(): Promise<ExtensionSettings> {
    return await this.repository.resetSettings();
  }
}
