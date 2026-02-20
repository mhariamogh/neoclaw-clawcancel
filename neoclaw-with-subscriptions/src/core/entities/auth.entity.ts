export interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  gatewayUrl: string | null;
  gatewayToken: string | null;
}

export const DEFAULT_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  username: null,
  gatewayUrl: null,
  gatewayToken: null,
};
