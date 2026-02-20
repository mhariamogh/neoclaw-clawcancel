import { useState, useEffect, useCallback } from 'react';
import type { AuthState } from '@/core';
import { DEFAULT_AUTH_STATE } from '@/core';
import { MessageType } from '@/platforms/extension/types';
import type { ExtensionResponse } from '@/platforms/extension/types';

const INSTANCE_STORAGE_KEY = 'neoclaw_instance';

export type LoginErrorKind = 'error' | 'info';

interface UseAuthReturn {
  authState: AuthState;
  loading: boolean;
  error: string | null;
  errorKind: LoginErrorKind;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<LoginErrorKind>('error');

  const loadAuthState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ExtensionResponse = await chrome.runtime.sendMessage({
        type: MessageType.GET_AUTH_STATE,
      });

      if (response.success) {
        setAuthState(response.data as AuthState);
      } else {
        setError(response.error ?? 'Failed to load auth state');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setError(null);
      setErrorKind('error');
      setLoading(true);
      const response: ExtensionResponse = await chrome.runtime.sendMessage({
        type: MessageType.LOGIN,
        username,
        password,
      });

      if (response.success) {
        setAuthState(response.data as AuthState);
      } else {
        setError(response.error ?? 'Login failed');
        if (!response.success && response.errorKind) {
          setErrorKind(response.errorKind);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setErrorKind('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      const response: ExtensionResponse = await chrome.runtime.sendMessage({
        type: MessageType.LOGOUT,
      });

      if (response.success) {
        setAuthState(response.data as AuthState);
      } else {
        setError(response.error ?? 'Logout failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  useEffect(() => {
    if (!authState.isLoggedIn || !authState.gatewayUrl || !authState.gatewayToken) {
      localStorage.removeItem(INSTANCE_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      INSTANCE_STORAGE_KEY,
      JSON.stringify({
        url: authState.gatewayUrl,
        token: authState.gatewayToken,
      }),
    );
  }, [authState.isLoggedIn, authState.gatewayUrl, authState.gatewayToken]);

  return { authState, loading, error, errorKind, login, logout };
}
