import { useState, useEffect, useCallback } from 'react';
import type { ExtensionSettings } from '@/core';
import { MessageType } from '@/platforms/extension/types';
import type { ExtensionResponse } from '@/platforms/extension/types';

export const useSettings = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ExtensionResponse = await chrome.runtime.sendMessage({
        type: MessageType.GET_SETTINGS,
      });

      if (response.success) {
        setSettings(response.data as ExtensionSettings);
      } else {
        setError(response.error ?? 'Failed to load settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<ExtensionSettings>) => {
    try {
      setError(null);
      const response: ExtensionResponse = await chrome.runtime.sendMessage({
        type: MessageType.UPDATE_SETTINGS,
        payload: updates,
      });

      if (response.success) {
        setSettings(response.data as ExtensionSettings);
      } else {
        setError(response.error ?? 'Failed to update settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      setError(null);
      const response: ExtensionResponse = await chrome.runtime.sendMessage({
        type: MessageType.RESET_SETTINGS,
      });

      if (response.success) {
        setSettings(response.data as ExtensionSettings);
      } else {
        setError(response.error ?? 'Failed to reset settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading, error, updateSettings, resetSettings, reload: loadSettings };
};
