import React from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { theme } from '@/features/theme';
import type { ChatMessage } from '@/core';

const BubbleRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(p) => (p.$isUser ? 'flex-end' : 'flex-start')};
  padding: 4px 16px;
`;

const Bubble = styled.div<{ $isUser: boolean; $isSystem: boolean }>`
  font-size: 16px;
  line-height: 1.65;
  word-wrap: break-word;
  white-space: ${(p) => (p.$isUser || p.$isSystem ? 'pre-wrap' : 'normal')};

  ${(p) =>
    p.$isSystem
      ? `
    max-width: 90%;
    padding: 10px 14px;
    background-color: ${theme.colors.errorBg};
    color: ${theme.colors.error};
    border-radius: ${theme.borderRadius.sm};
    font-size: 13px;
  `
      : p.$isUser
        ? `
    max-width: 75%;
    padding: 10px 14px;
    border-radius: 16px;
    background-color: ${theme.colors.userBubble};
    color: #FFFFFF;
    border-bottom-right-radius: 4px;
  `
        : `
    width: 100%;
    color: ${theme.colors.textPrimary};
  `}
`;

const Timestamp = styled.span<{ $isUser: boolean }>`
  display: block;
  font-size: 11px;
  color: ${theme.colors.textMuted};
  margin-top: 4px;
  text-align: ${(p) => (p.$isUser ? 'right' : 'left')};
  padding: 0 16px;
`;

const AudioPlayer = styled.audio`
  display: block;
  width: 100%;
  max-width: 280px;
  height: 36px;
  margin-top: 6px;
  border-radius: ${theme.borderRadius.sm};

  &::-webkit-media-controls-panel {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const VoiceLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.85;
`;

const MarkdownContent = styled.div`
  p {
    margin: 0 0 12px 0;

    &:last-child {
      margin: 0;
    }
  }

  strong {
    font-weight: 700;
  }

  em {
    font-style: italic;
  }

  code {
    font-family: 'SF Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.88em;
    background-color: rgba(0, 0, 0, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
  }

  pre {
    background-color: ${theme.colors.textPrimary};
    color: #e5e7eb;
    padding: 14px;
    border-radius: ${theme.borderRadius.sm};
    overflow-x: auto;
    margin: 12px 0;

    &:last-child {
      margin-bottom: 0;
    }

    code {
      background-color: transparent;
      padding: 0;
      font-size: 0.85em;
      color: inherit;
    }
  }

  ul,
  ol {
    margin: 6px 0 12px 0;
    padding-left: 22px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  li {
    margin-bottom: 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 16px 0 8px 0;
    font-weight: 700;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 { font-size: 1.35em; }
  h2 { font-size: 1.25em; }
  h3 { font-size: 1.15em; }
  h4, h5, h6 { font-size: 1.05em; }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  hr {
    border: none;
    border-top: 1px solid ${theme.colors.border};
    margin: 12px 0;
  }

  blockquote {
    margin: 6px 0 12px 0;
    padding-left: 14px;
    border-left: 3px solid ${theme.colors.border};
    color: ${theme.colors.textSecondary};
  }
`;

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div>
      <BubbleRow $isUser={isUser}>
        <Bubble $isUser={isUser} $isSystem={isSystem}>
          {isUser ? (
            <>
              {message.audioDataUrl ? (
                <>
                  <VoiceLabel>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="1" width="6" height="12" rx="3" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                    Voice message
                  </VoiceLabel>
                  <AudioPlayer controls preload="metadata" src={message.audioDataUrl} />
                </>
              ) : (
                message.content
              )}
            </>
          ) : (
            <MarkdownContent>
              <ReactMarkdown
                components={{
                  a: ({ href, children, ...props }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </MarkdownContent>
          )}
        </Bubble>
      </BubbleRow>
      <Timestamp $isUser={isUser}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Timestamp>
    </div>
  );
};

export default ChatBubble;
