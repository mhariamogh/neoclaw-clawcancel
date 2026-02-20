import type { AuthState, IStorageProvider, IAuthRepository } from '@/core';
import { DEFAULT_AUTH_STATE } from '@/core';

const AUTH_KEY = 'auth';

interface AuthRepositoryConfig {
  instanceApiUrl: string;
}

interface InstanceResponse {
  url?: string;
  token?: string;
}

export type AuthErrorKind = 'error' | 'info';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly kind: AuthErrorKind,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthRepository implements IAuthRepository {
  constructor(
    private storage: IStorageProvider,
    private config: AuthRepositoryConfig,
  ) {}

  async getAuthState(): Promise<AuthState> {
    return await this.storage.get<AuthState>(AUTH_KEY, DEFAULT_AUTH_STATE);
  }

  async login(username: string, password: string): Promise<AuthState> {
    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required');
    }

    const basicAuth = btoa(`${username}:${password}`);

    // Fetch instance metadata using HTTP Basic auth credentials.
    const response = await fetch(this.config.instanceApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (response.status === 202) {
      const body = await response.json().catch(() => ({}) as Record<string, unknown>);
      const message =
        typeof body.message === 'string'
          ? body.message
          : 'Your instance is being set up. Please check back in a little while.';
      throw new AuthError(message, 'info');
    }

    if (!response.ok) {
      if (response.status === 401) {
        const body = await response.json().catch(() => null);
        const detail =
          body && typeof body === 'object' && typeof (body as Record<string, unknown>).error === 'string'
            ? (body as Record<string, string>).error
            : 'Invalid credentials. Please check your username and password.';
        throw new AuthError(detail, 'error');
      }
      const text = await response.text().catch(() => 'Unknown error');
      throw new AuthError(`Login failed (${response.status}): ${text}`, 'error');
    }

    const data = (await response.json()) as InstanceResponse;
    if (!data.url || !data.token) {
      throw new AuthError('Instance response is missing required fields.', 'error');
    }

    const authState: AuthState = {
      isLoggedIn: true,
      username,
      gatewayUrl: data.url,
      gatewayToken: data.token,
    };

    await this.storage.set(AUTH_KEY, authState);
    return authState;
  }

  async logout(): Promise<AuthState> {
    await this.storage.set(AUTH_KEY, DEFAULT_AUTH_STATE);
    return DEFAULT_AUTH_STATE;
  }
}
