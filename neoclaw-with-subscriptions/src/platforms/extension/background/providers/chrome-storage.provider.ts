import type { IStorageProvider } from '@/core';

export class ChromeStorageProvider implements IStorageProvider {
  constructor(private area: 'sync' | 'local' = 'sync') {}

  async get<T>(key: string, defaultValue: T): Promise<T> {
    const result = await chrome.storage[this.area].get(key);
    return (result[key] as T) ?? defaultValue;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage[this.area].set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage[this.area].remove(key);
  }

  async clear(): Promise<void> {
    await chrome.storage[this.area].clear();
  }
}
