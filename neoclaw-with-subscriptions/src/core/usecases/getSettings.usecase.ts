import type { ExtensionSettings } from '../entities';
import type { ISettingsRepository } from '../interfaces';

export class GetSettingsUseCase {
  constructor(private repository: ISettingsRepository) {}

  async execute(): Promise<ExtensionSettings> {
    return await this.repository.getSettings();
  }
}
