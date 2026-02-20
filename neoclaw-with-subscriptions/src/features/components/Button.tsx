import styled, { css } from 'styled-components';
import { theme } from '@/features/theme';

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: ${theme.fontFamily};
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${(p) =>
    p.$variant === 'secondary'
      ? css`
          background-color: ${theme.colors.assistantBubble};
          color: ${theme.colors.textPrimary};

          &:hover {
            background-color: ${theme.colors.border};
          }

          &:active {
            background-color: #d1d5db;
          }
        `
      : css`
          background-color: ${theme.colors.primary};
          color: white;

          &:hover {
            background-color: ${theme.colors.primaryHover};
          }

          &:active {
            background-color: ${theme.colors.primaryActive};
          }
        `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
