import type { IStorageProvider } from '@/core';
import { DEFAULT_SETTINGS } from '@/core';

export class InstallationListener {
  constructor(private storage: IStorageProvider) {}

  register(): void {
    chrome.runtime.onInstalled.addListener(async (details) => {
      if (details.reason === 'install') {
        await this.storage.set('settings', {
          ...DEFAULT_SETTINGS,
          updatedAt: Date.now(),
        });
        console.log('[ClawCancel] Extension installed, default settings initialized.');
      }

      if (details.reason === 'update') {
        console.log(`[ClawCancel] Extension updated to version ${chrome.runtime.getManifest().version}`);
      }
    });
  }
}
