import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '@/features/theme';

/* ── Types ── */

type IntegrationId = 'google' | 'linkedin' | 'opentable';

interface IntegrationState {
  connected: boolean;
  email?: string;
}

type IntegrationsMap = Record<IntegrationId, IntegrationState>;

type PopupPhase = 'idle' | 'oauth' | 'connecting' | 'done';

/* ── Overlay & Panel (slide-in from right) ── */

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: ${(p) => (p.$open ? 1 : 0)};
  visibility: ${(p) => (p.$open ? 'visible' : 'hidden')};
  transition: opacity 0.25s, visibility 0.25s;
  z-index: 200;
`;

const Panel = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 90vw;
  background: ${theme.colors.surface};
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  transform: translateX(${(p) => (p.$open ? '0' : '100%')});
  transition: transform 0.25s ease;
  z-index: 201;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.border};
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: ${theme.colors.textSecondary};
  font-size: 20px;
  line-height: 1;
  border-radius: 4px;
  transition: background 0.15s;

  &:hover {
    background: ${theme.colors.assistantBubble};
    color: ${theme.colors.textPrimary};
  }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionSubtitle = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin: 0 0 4px;
`;

/* ── Integration Card ── */

const IntegrationCard = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
`;

const IconWrapper = styled.div<{ $bg: string }>`
  width: 44px;
  height: 44px;
  border-radius: ${theme.borderRadius.sm};
  background: ${(p) => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const IntegrationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const IntegrationName = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const IntegrationDesc = styled.p`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin: 2px 0 0;
`;

const ConnectedLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.success};
`;

const ConnectedDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${theme.colors.success};
`;

const ConnectButton = styled.button`
  padding: 7px 18px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background: ${theme.colors.surface};
  color: ${theme.colors.textPrimary};
  font-size: 13px;
  font-weight: 600;
  font-family: ${theme.fontFamily};
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    background: #f5f3ff;
  }
`;

const ComingSoonBadge = styled.span`
  padding: 4px 10px;
  border-radius: ${theme.borderRadius.pill};
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
  color: #7c3aed;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  flex-shrink: 0;
  white-space: nowrap;
`;

const ComingSoonCard = styled(IntegrationCard)`
  opacity: 0.65;
  cursor: default;

  &:hover {
    box-shadow: none;
  }
`;

const DisconnectButton = styled.button`
  padding: 7px 18px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background: ${theme.colors.surface};
  color: ${theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 600;
  font-family: ${theme.fontFamily};
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    border-color: ${theme.colors.error};
    color: ${theme.colors.error};
    background: ${theme.colors.errorBg};
  }
`;

/* ── OAuth Popup Modal ── */

const PopupBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
`;

const PopupWindow = styled.div`
  width: 440px;
  max-width: 92vw;
  max-height: 85vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PopupTitleBar = styled.div<{ $bg: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: ${(p) => p.$bg};
  flex-shrink: 0;
`;

const PopupTitleText = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #fff;
`;

const PopupCloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }
`;

const PopupContent = styled.div`
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const PopupLogo = styled.div`
  font-size: 36px;
  line-height: 1;
`;

const PopupHeading = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin: 0;
  text-align: center;
`;

const PopupSubheading = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin: 0;
  text-align: center;
  max-width: 320px;
`;

const FakeAccountRow = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background: ${theme.colors.surface};
  cursor: pointer;
  font-family: ${theme.fontFamily};
  transition: all 0.15s;

  &:hover {
    border-color: ${theme.colors.primary};
    background: #f9f8ff;
  }
`;

const AccountAvatar = styled.div<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(p) => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
`;

const AccountDetails = styled.div`
  text-align: left;
`;

const AccountName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const AccountEmail = styled.p`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin: 0;
`;

const PermissionsList = styled.div`
  width: 100%;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: ${theme.borderRadius.sm};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PermissionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${theme.colors.textSecondary};
`;

const PermissionCheck = styled.span`
  color: ${theme.colors.success};
  font-size: 14px;
`;

const PopupFooter = styled.p`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  margin: 0;
  text-align: center;
`;

/* ── Connecting Animation ── */

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const Spinner = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${(p) => p.$color};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const ConnectingText = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const SuccessIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${theme.colors.success};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26px;
  animation: ${fadeIn} 0.3s ease;
`;

const SuccessText = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.success};
  margin: 0;
`;

const SuccessDetail = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin: 0;
  text-align: center;
`;

/* ── SVG Icons (inline for simplicity) ── */

const GoogleIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const LinkedInIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 48 48">
    <path fill="#0A66C2" d="M44.45 0H3.55A3.5 3.5 0 0 0 0 3.46v41.08A3.5 3.5 0 0 0 3.55 48h40.9A3.5 3.5 0 0 0 48 44.54V3.46A3.5 3.5 0 0 0 44.45 0z" />
    <path fill="#fff" d="M7.11 17.97h6.71v21.56H7.11zm3.35-10.7a3.89 3.89 0 1 1 0 7.78 3.89 3.89 0 0 1 0-7.78zM18.34 17.97h6.43v2.95h.09c.9-1.7 3.09-3.49 6.36-3.49 6.8 0 8.06 4.47 8.06 10.29v11.81h-6.71v-10.48c0-2.5-.04-5.72-3.49-5.72-3.49 0-4.02 2.73-4.02 5.54v10.66h-6.72z" />
  </svg>
);

const OpenTableIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="#DA3743" />
    <circle cx="24" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="3.5" />
    <circle cx="24" cy="24" r="4" fill="#fff" />
  </svg>
);

/* ── Integration Config ── */

interface IntegrationConfig {
  id: IntegrationId;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  brandColor: string;
  comingSoon?: boolean;
  fakeEmail?: string;
  fakeName?: string;
  popupTitle?: string;
  permissions?: string[];
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'google',
    name: 'Google',
    description: 'Connect your Google account for calendar and contacts',
    icon: <GoogleIcon />,
    iconBg: '#f1f3f4',
    brandColor: '#4285F4',
    fakeEmail: import.meta.env.VITE_FAKE_GOOGLE_EMAIL || 'user@gmail.com',
    fakeName: import.meta.env.VITE_FAKE_GOOGLE_NAME || 'NeoClaw User',
    popupTitle: 'Sign in with Google',
    permissions: [
      'View your email address',
      'View your basic profile info',
      'See your Google Calendar events',
      'View your contacts',
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn for professional networking',
    icon: <LinkedInIcon />,
    iconBg: '#E8F0FE',
    brandColor: '#0A66C2',
    fakeEmail: import.meta.env.VITE_FAKE_LINKEDIN_EMAIL || 'user@company.com',
    fakeName: import.meta.env.VITE_FAKE_LINKEDIN_NAME || 'NeoClaw User',
    popupTitle: 'Sign in to LinkedIn',
    permissions: [
      'Access your profile information',
      'Access your connections',
      'View your professional activity',
      'Read your messages',
    ],
  },
  {
    id: 'opentable',
    name: 'OpenTable',
    description: 'Book and manage restaurant reservations',
    icon: <OpenTableIcon />,
    iconBg: '#fef2f2',
    brandColor: '#DA3743',
    comingSoon: true,
  },
];

/* ── Sub-Components ── */

interface OAuthPopupProps {
  config: IntegrationConfig;
  phase: PopupPhase;
  onSelectAccount: () => void;
  onClose: () => void;
}

const OAuthPopup: React.FC<OAuthPopupProps> = ({ config, phase, onSelectAccount, onClose }) => {
  if (phase === 'idle') return null;
  const accountName = config.fakeName ?? 'NeoClaw User';
  const accountEmail = config.fakeEmail ?? 'user@example.com';
  const permissions = config.permissions ?? [];

  return (
    <PopupBackdrop onClick={onClose}>
      <PopupWindow onClick={(e) => e.stopPropagation()}>
        <PopupTitleBar $bg={config.brandColor}>
          <PopupTitleText>{config.popupTitle}</PopupTitleText>
          <PopupCloseBtn onClick={onClose} aria-label="Close popup">
            &#x2715;
          </PopupCloseBtn>
        </PopupTitleBar>

        <PopupContent>
          {phase === 'oauth' && (
            <>
              <PopupLogo>
                {config.id === 'google' ? <GoogleIcon /> : <LinkedInIcon />}
              </PopupLogo>
              <PopupHeading>{config.popupTitle}</PopupHeading>
              <PopupSubheading>
                Choose an account to continue to NeoClaw
              </PopupSubheading>

              <FakeAccountRow onClick={onSelectAccount}>
                <AccountAvatar $bg={config.brandColor}>
                  {accountName.charAt(0)}
                </AccountAvatar>
                <AccountDetails>
                  <AccountName>{accountName}</AccountName>
                  <AccountEmail>{accountEmail}</AccountEmail>
                </AccountDetails>
              </FakeAccountRow>

              <PermissionsList>
                <PermissionItem style={{ fontWeight: 600, color: theme.colors.textPrimary, fontSize: 12 }}>
                  NeoClaw will be able to:
                </PermissionItem>
                {permissions.map((perm) => (
                  <PermissionItem key={perm}>
                    <PermissionCheck>&#x2713;</PermissionCheck>
                    {perm}
                  </PermissionItem>
                ))}
              </PermissionsList>

              <PopupFooter>
                By continuing, {config.name} will share your name, email, and profile picture with NeoClaw.
              </PopupFooter>
            </>
          )}

          {phase === 'connecting' && (
            <>
              <Spinner $color={config.brandColor} />
              <ConnectingText>Connecting to {config.name}...</ConnectingText>
              <PopupSubheading>Verifying your account and setting up the integration</PopupSubheading>
            </>
          )}

          {phase === 'done' && (
            <>
              <SuccessIcon>&#x2713;</SuccessIcon>
              <SuccessText>Connected!</SuccessText>
              <SuccessDetail>
                Your {config.name} account ({accountEmail}) has been successfully connected to NeoClaw.
              </SuccessDetail>
            </>
          )}
        </PopupContent>
      </PopupWindow>
    </PopupBackdrop>
  );
};

/* ── Main Component ── */

interface IntegrationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'neoclaw_integrations';

function loadIntegrations(): IntegrationsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IntegrationsMap;
  } catch {
    /* ignore */
  }
  return {
    google: { connected: false },
    linkedin: { connected: false },
    opentable: { connected: false },
  };
}

function saveIntegrations(state: IntegrationsMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ open, onClose }) => {
  const [integrations, setIntegrations] = useState<IntegrationsMap>(loadIntegrations);
  const [activePopup, setActivePopup] = useState<IntegrationId | null>(null);
  const [popupPhase, setPopupPhase] = useState<PopupPhase>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePopupRef = useRef<IntegrationId | null>(null);

  /* Keep ref in sync so timeouts always read the latest value */
  useEffect(() => {
    activePopupRef.current = activePopup;
  }, [activePopup]);

  /* Persist changes */
  useEffect(() => {
    saveIntegrations(integrations);
  }, [integrations]);

  /* Clean up timers */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleConnect = useCallback((id: IntegrationId) => {
    setActivePopup(id);
    setPopupPhase('oauth');
  }, []);

  const handleSelectAccount = useCallback(() => {
    /* Capture the id right now via ref so nested timeouts never go stale */
    const popupId = activePopupRef.current;
    if (!popupId) return;

    setPopupPhase('connecting');

    timerRef.current = setTimeout(() => {
      setPopupPhase('done');

      timerRef.current = setTimeout(() => {
        const config = INTEGRATIONS.find((i) => i.id === popupId);
        setIntegrations((prev) => ({
          ...prev,
          [popupId]: { connected: true, email: config?.fakeEmail },
        }));
        setPopupPhase('idle');
        setActivePopup(null);
      }, 1500);
    }, 2000);
  }, []);

  const forceClosePopup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPopupPhase('idle');
    setActivePopup(null);
  }, []);

  /* Reworked: allow cancel only during oauth phase */
  const handlePopupClose = useCallback(() => {
    if (popupPhase === 'connecting' || popupPhase === 'done') {
      /* Don't allow dismissal while connecting or showing success */
      return;
    }
    forceClosePopup();
  }, [popupPhase, forceClosePopup]);

  const handleDisconnect = useCallback((id: IntegrationId) => {
    setIntegrations((prev) => ({
      ...prev,
      [id]: { connected: false },
    }));
  }, []);

  const activeConfig = activePopup
    ? INTEGRATIONS.find((i) => i.id === activePopup) ?? null
    : null;

  return (
    <>
      <Overlay $open={open} onClick={onClose} />
      <Panel $open={open}>
        <PanelHeader>
          <PanelTitle>Integrations</PanelTitle>
          <CloseButton onClick={onClose} aria-label="Close integrations">
            &#x2715;
          </CloseButton>
        </PanelHeader>

        <PanelBody>
          <SectionSubtitle>
            Connect your accounts to enhance your NeoClaw experience.
          </SectionSubtitle>

          {INTEGRATIONS.map((config) => {
            if (config.comingSoon) {
              return (
                <ComingSoonCard key={config.id}>
                  <IconWrapper $bg={config.iconBg}>{config.icon}</IconWrapper>
                  <IntegrationInfo>
                    <IntegrationName>{config.name}</IntegrationName>
                    <IntegrationDesc>{config.description}</IntegrationDesc>
                  </IntegrationInfo>
                  <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                </ComingSoonCard>
              );
            }

            const state = integrations[config.id];

            return (
              <IntegrationCard key={config.id}>
                <IconWrapper $bg={config.iconBg}>{config.icon}</IconWrapper>
                <IntegrationInfo>
                  <IntegrationName>{config.name}</IntegrationName>
                  <IntegrationDesc>
                    {state.connected ? state.email : config.description}
                  </IntegrationDesc>
                  {state.connected && (
                    <ConnectedLabel>
                      <ConnectedDot /> Connected
                    </ConnectedLabel>
                  )}
                </IntegrationInfo>
                {state.connected ? (
                  <DisconnectButton onClick={() => handleDisconnect(config.id)}>
                    Disconnect
                  </DisconnectButton>
                ) : (
                  <ConnectButton onClick={() => handleConnect(config.id)}>
                    Connect
                  </ConnectButton>
                )}
              </IntegrationCard>
            );
          })}
        </PanelBody>
      </Panel>

      {activeConfig && (
        <OAuthPopup
          config={activeConfig}
          phase={popupPhase}
          onSelectAccount={handleSelectAccount}
          onClose={handlePopupClose}
        />
      )}
    </>
  );
};

export default IntegrationsPanel;
