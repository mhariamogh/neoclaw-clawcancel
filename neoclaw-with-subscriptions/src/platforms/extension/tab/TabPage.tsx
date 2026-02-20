import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GlobalStyles, ChatBubble, ChatInput, ChatSidebar, TypingIndicator, LoginPopover } from '@/features/components';
import { useChat, useAuth } from '@/features/hooks';
import { theme } from '@/features/theme';

/* ── Layout ── */

const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: ${theme.colors.gradient};
  flex-shrink: 0;
  z-index: 101;
`;

const Logo = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HistoryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #ffffff;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderButton = styled.button`
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  font-family: ${theme.fontFamily};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: #ffffff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const CredentialsWrapper = styled.div`
  position: relative;
`;

const CredentialsDropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  opacity: ${(p) => (p.$open ? 1 : 0)};
  visibility: ${(p) => (p.$open ? 'visible' : 'hidden')};
  transform: translateY(${(p) => (p.$open ? '0' : '-4px')});
  transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
  z-index: 150;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CredentialRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CredentialLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const CredentialValueRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  padding: 8px 10px;
`;

const CredentialValue = styled.code`
  font-family: ${theme.fontFamily};
  font-size: 12px;
  color: ${theme.colors.textPrimary};
  word-break: break-all;
  flex: 1;
  min-width: 0;
`;

const CredentialIconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover {
    background: ${theme.colors.assistantBubble};
    color: ${theme.colors.primary};
  }
`;

const ChatArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ScrollContent = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  background: ${theme.colors.surface};
`;

const MessageList = styled.div`
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputFooter = styled.div`
  flex-shrink: 0;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  background: ${theme.colors.surface};
`;


const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textMuted};
  gap: 10px;
`;

const EmptyTitle = styled.p`
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  background: ${theme.colors.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const EmptySubtitle = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  margin: 0;
`;

/* ── Component ── */

export const TabPage: React.FC = () => {
  const {
    messages,
    sessions,
    currentSessionId,
    isStreaming,
    sendMessage,
    abortStream,
    clearSession,
    switchSession,
    deleteSession,
    refreshSessions,
    refreshMessages,
  } = useChat();
  const { authState, loading: authLoading, error: authError, errorKind: authErrorKind, login, logout } = useAuth();
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<'url' | 'token' | null>(null);
  const credentialsRef = useRef<HTMLDivElement>(null);

  const hasGatewayInfo = Boolean(authState.gatewayUrl && authState.gatewayToken);
  const gatewayUrl = authState.gatewayUrl ?? '';
  const gatewayToken = authState.gatewayToken ?? '';

  const showTypingIndicator =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'user';

  const handleLogout = useCallback(() => {
    clearSession();
    logout();
  }, [clearSession, logout]);

  const handleOpenSidebar = useCallback(() => {
    refreshSessions();
    setSidebarOpen(true);
  }, [refreshSessions]);

  const maskSecret = useCallback((value: string): string => {
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
  }, []);

  const handleCopy = useCallback((value: string, field: 'url' | 'token') => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }, []);

  useEffect(() => {
    if (!credentialsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (credentialsRef.current && !credentialsRef.current.contains(e.target as Node)) {
        setCredentialsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [credentialsOpen]);

  // Auto-scroll to bottom when messages or typing indicator change
  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [messages, isStreaming]);

  // Real-time updates: Listen for new reports from background service
  useEffect(() => {
    const handleRuntimeMessage = (message: any) => {
      if (message.type === 'NEW_REPORT') {
        // New report posted - refresh messages to get latest
        refreshMessages();
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, [refreshMessages]);

  // Refresh on tab visibility (catch-up when switching back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMessages]);

  return (
    <>
      <GlobalStyles />
      <PageShell>
        <Header>
          <HeaderLeft>
            {authState.isLoggedIn && (
              <HistoryButton onClick={handleOpenSidebar} aria-label="Chat history">
                &#9776;
              </HistoryButton>
            )}
            <Logo>{authState.username ? `${authState.username} team's ClawCancel` : 'ClawCancel'}</Logo>
          </HeaderLeft>
          {authState.isLoggedIn && (
            <HeaderActions>
              {messages.length > 0 && (
                <HeaderButton onClick={clearSession} disabled={isStreaming}>
                  New Chat
                </HeaderButton>
              )}
              {hasGatewayInfo && (
                <CredentialsWrapper ref={credentialsRef}>
                  <HeaderButton
                    onClick={() => setCredentialsOpen((v) => !v)}
                    aria-label="Gateway credentials"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, verticalAlign: -2 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Credentials
                  </HeaderButton>
                  <CredentialsDropdown $open={credentialsOpen}>
                    <CredentialRow>
                      <CredentialLabel>Gateway URL</CredentialLabel>
                      <CredentialValueRow>
                        <CredentialValue>{showUrl ? gatewayUrl : maskSecret(gatewayUrl)}</CredentialValue>
                        <CredentialIconBtn
                          onClick={() => setShowUrl((v) => !v)}
                          aria-label={showUrl ? 'Hide URL' : 'Show URL'}
                          title={showUrl ? 'Hide' : 'Show'}
                        >
                          {showUrl ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-8a17.29 17.29 0 0 1 4.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.11 11 8a17.4 17.4 0 0 1-2.77 4.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12C2.9 8.6 6.5 6 11 6s8.1 2.6 10 6c-1.9 3.4-5.5 6-10 6S2.9 15.4 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="11" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          )}
                        </CredentialIconBtn>
                        <CredentialIconBtn
                          onClick={() => handleCopy(gatewayUrl, 'url')}
                          aria-label="Copy URL"
                          title="Copy"
                        >
                          {copiedField === 'url' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <polyline points="20 6 9 17 4 12" stroke={theme.colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                        </CredentialIconBtn>
                      </CredentialValueRow>
                    </CredentialRow>
                    <CredentialRow>
                      <CredentialLabel>Gateway Token</CredentialLabel>
                      <CredentialValueRow>
                        <CredentialValue>{showToken ? gatewayToken : maskSecret(gatewayToken)}</CredentialValue>
                        <CredentialIconBtn
                          onClick={() => setShowToken((v) => !v)}
                          aria-label={showToken ? 'Hide token' : 'Show token'}
                          title={showToken ? 'Hide' : 'Show'}
                        >
                          {showToken ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-8a17.29 17.29 0 0 1 4.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.11 11 8a17.4 17.4 0 0 1-2.77 4.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12C2.9 8.6 6.5 6 11 6s8.1 2.6 10 6c-1.9 3.4-5.5 6-10 6S2.9 15.4 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="11" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          )}
                        </CredentialIconBtn>
                        <CredentialIconBtn
                          onClick={() => handleCopy(gatewayToken, 'token')}
                          aria-label="Copy token"
                          title="Copy"
                        >
                          {copiedField === 'token' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <polyline points="20 6 9 17 4 12" stroke={theme.colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                        </CredentialIconBtn>
                      </CredentialValueRow>
                    </CredentialRow>
                  </CredentialsDropdown>
                </CredentialsWrapper>
              )}
              <HeaderButton onClick={handleLogout}>Logout</HeaderButton>
            </HeaderActions>
          )}
        </Header>

        <ChatArea>
          <ScrollArea>
            <ScrollContent>
              {messages.length === 0 ? (
                <EmptyState>
                  <EmptyTitle>Welcome to ClawCancel</EmptyTitle>
                  <EmptySubtitle>Send a message to start chatting with OpenClaw.</EmptySubtitle>
                </EmptyState>
              ) : (
                <MessageList>
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {showTypingIndicator && <TypingIndicator />}
                  <div ref={bottomAnchorRef} />
                </MessageList>
              )}
            </ScrollContent>
          </ScrollArea>

          <InputFooter>
            <ChatInput onSend={sendMessage} onAbort={abortStream} disabled={isStreaming} />
          </InputFooter>
        </ChatArea>

        {!authState.isLoggedIn && (
          <LoginPopover
            authState={authState}
            loading={authLoading}
            error={authError}
            errorKind={authErrorKind}
            onLogin={login}
          />
        )}

        <ChatSidebar
          open={sidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onClose={() => setSidebarOpen(false)}
          onNewChat={clearSession}
          onSwitchSession={switchSession}
          onDeleteSession={deleteSession}
        />
      </PageShell>
    </>
  );
};
