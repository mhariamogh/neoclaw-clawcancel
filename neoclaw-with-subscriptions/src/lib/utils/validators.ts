import type { ExtensionSettings } from '@/core';

const VALID_THEMES: ExtensionSettings['theme'][] = ['light', 'dark', 'auto'];

export function isValidTheme(theme: string): theme is ExtensionSettings['theme'] {
  return VALID_THEMES.includes(theme as ExtensionSettings['theme']);
}

export function isValidSettings(settings: unknown): settings is ExtensionSettings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const s = settings as Record<string, unknown>;

  return (
    typeof s.version === 'string' &&
    typeof s.enabled === 'boolean' &&
    typeof s.theme === 'string' &&
    isValidTheme(s.theme) &&
    typeof s.notifications === 'boolean' &&
    typeof s.debugMode === 'boolean' &&
    typeof s.customOptions === 'object' &&
    s.customOptions !== null &&
    typeof s.updatedAt === 'number'
  );
}

export function sanitizePartialSettings(
  updates: Partial<ExtensionSettings>,
): Partial<ExtensionSettings> {
  const sanitized: Partial<ExtensionSettings> = {};

  if (updates.theme !== undefined && isValidTheme(updates.theme)) {
    sanitized.theme = updates.theme;
  }
  if (updates.enabled !== undefined) {
    sanitized.enabled = Boolean(updates.enabled);
  }
  if (updates.notifications !== undefined) {
    sanitized.notifications = Boolean(updates.notifications);
  }
  if (updates.debugMode !== undefined) {
    sanitized.debugMode = Boolean(updates.debugMode);
  }
  if (updates.customOptions !== undefined && typeof updates.customOptions === 'object') {
    sanitized.customOptions = updates.customOptions;
  }

  return sanitized;
}
