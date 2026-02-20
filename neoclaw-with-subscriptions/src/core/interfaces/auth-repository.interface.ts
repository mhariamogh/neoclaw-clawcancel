import type { AuthState } from '../entities';

export interface IAuthRepository {
  getAuthState(): Promise<AuthState>;
  login(username: string, password: string): Promise<AuthState>;
  logout(): Promise<AuthState>;
}
