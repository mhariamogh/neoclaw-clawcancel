import React, { useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '@/features/theme';
import type { ChatSessionSummary } from '@/core';

/* ── Styled Components ── */

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
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 85vw;
  background: ${theme.colors.surface};
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  transform: translateX(${(p) => (p.$open ? '0' : '-100%')});
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

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 10px 16px;
  border: 1px dashed ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: ${theme.colors.primary};
  font-size: 14px;
  font-weight: 600;
  font-family: ${theme.fontFamily};
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.assistantBubble};
    border-color: ${theme.colors.primary};
  }
`;

const SessionList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
`;

const SessionItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: ${(p) => (p.$active ? theme.colors.assistantBubble : 'transparent')};
  cursor: pointer;
  text-align: left;
  font-family: ${theme.fontFamily};
  transition: background 0.15s;

  &:hover {
    background: ${(p) => (p.$active ? theme.colors.assistantBubble : '#f9fafb')};
  }
`;

const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SessionTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionDate = styled.p`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin: 2px 0 0;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  color: ${theme.colors.textMuted};
  font-size: 14px;
  line-height: 1;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;

  ${SessionItem}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${theme.colors.error};
    background: ${theme.colors.errorBg};
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${theme.colors.textMuted};
  font-size: 14px;
  padding: 32px 20px;
  margin: 0;
`;

/* ── Helpers ── */

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/* ── Component ── */

interface ChatSidebarProps {
  open: boolean;
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  open,
  sessions,
  currentSessionId,
  onClose,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
}) => {
  const handleSessionClick = useCallback(
    (sessionId: string) => {
      onSwitchSession(sessionId);
      onClose();
    },
    [onSwitchSession, onClose],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      onDeleteSession(sessionId);
    },
    [onDeleteSession],
  );

  const handleNewChat = useCallback(() => {
    onNewChat();
    onClose();
  }, [onNewChat, onClose]);

  return (
    <>
      <Overlay $open={open} onClick={onClose} />
      <Panel $open={open}>
        <PanelHeader>
          <PanelTitle>Chat History</PanelTitle>
          <CloseButton onClick={onClose} aria-label="Close sidebar">
            &#x2715;
          </CloseButton>
        </PanelHeader>

        <NewChatButton onClick={handleNewChat}>
          + New Chat
        </NewChatButton>

        <SessionList>
          {sessions.length === 0 ? (
            <EmptyMessage>No previous chats yet.</EmptyMessage>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                $active={session.id === currentSessionId}
                onClick={() => handleSessionClick(session.id)}
              >
                <SessionInfo>
                  <SessionTitle>{session.title}</SessionTitle>
                  <SessionDate>{formatDate(session.updatedAt)}</SessionDate>
                </SessionInfo>
                <DeleteButton
                  onClick={(e) => handleDelete(e, session.id)}
                  aria-label={`Delete chat: ${session.title}`}
                >
                  &#x1D5EB;
                </DeleteButton>
              </SessionItem>
            ))
          )}
        </SessionList>
      </Panel>
    </>
  );
};

export default ChatSidebar;
