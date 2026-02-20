import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '@/features/theme';
import type { AuthState } from '@/core';
import type { LoginErrorKind } from '@/features/hooks/useAuth';

/* ── Backdrop & Layout ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const PopoverCard = styled.div`
  width: 380px;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/* ── Typography ── */

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin: 0;
  background: ${theme.colors.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin: 0;
`;

/* ── Form Elements ── */

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const Input = styled.input`
  padding: 10px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  font-size: 14px;
  font-family: ${theme.fontFamily};
  color: ${theme.colors.textPrimary};
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: ${theme.colors.textMuted};
  }

  &:focus {
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    background: ${theme.colors.background};
    color: ${theme.colors.textMuted};
  }
`;

const PrimaryButton = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  font-size: 15px;
  font-weight: 600;
  font-family: ${theme.fontFamily};
  color: #ffffff;
  background: ${theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: ${theme.colors.primaryHover};
  }

  &:active:not(:disabled) {
    background: ${theme.colors.primaryActive};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AlertBanner = styled.div<{ $kind: 'error' | 'info' }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $kind }) => ($kind === 'info' ? theme.colors.infoBg : theme.colors.errorBg)};
  border-left: 3px solid ${({ $kind }) => ($kind === 'info' ? theme.colors.info : theme.colors.error)};
`;

const AlertIcon = styled.span<{ $kind: 'error' | 'info' }>`
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1.4;
  color: ${({ $kind }) => ($kind === 'info' ? theme.colors.info : theme.colors.error)};
`;

const AlertMessage = styled.p<{ $kind: 'error' | 'info' }>`
  font-size: 13px;
  line-height: 1.4;
  color: ${({ $kind }) => ($kind === 'info' ? theme.colors.info : theme.colors.error)};
  margin: 0;
`;

/* ── Component ── */

interface LoginPopoverProps {
  authState: AuthState;
  loading: boolean;
  error: string | null;
  errorKind: LoginErrorKind;
  onLogin: (username: string, password: string) => Promise<void>;
}

const LoginPopover: React.FC<LoginPopoverProps> = ({
  authState,
  loading,
  error,
  errorKind,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onLogin(username, password);
    },
    [username, password, onLogin],
  );

  // Hide popover once logged in
  if (authState.isLoggedIn) {
    return null;
  }

  // View A: Login form
  return (
    <Overlay>
      <PopoverCard as="form" onSubmit={handleLogin}>
        <Title>Welcome back</Title>
        <Subtitle>Sign in to continue to NeoClaw</Subtitle>
        <FormGroup>
          <Label htmlFor="login-username">Username</Label>
          <Input
            id="login-username"
            type="text"
            placeholder="Team name (case-sensitive)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </FormGroup>
        {error && (
          <AlertBanner $kind={errorKind}>
            <AlertIcon $kind={errorKind}>{errorKind === 'info' ? 'ℹ' : '✕'}</AlertIcon>
            <AlertMessage $kind={errorKind}>{error}</AlertMessage>
          </AlertBanner>
        )}
        <PrimaryButton type="submit" disabled={loading || !username.trim() || !password.trim()}>
          {loading ? 'Signing in...' : 'Sign In'}
        </PrimaryButton>
      </PopoverCard>
    </Overlay>
  );
};

export default LoginPopover;
