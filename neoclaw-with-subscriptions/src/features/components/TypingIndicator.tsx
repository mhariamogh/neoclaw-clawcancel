import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '@/features/theme';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
`;

const IndicatorRow = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 4px 16px;
`;

const Bubble = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 18px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  background-color: ${theme.colors.assistantBubble};
`;

const Dot = styled.span<{ $delay: string; $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(p) => p.$color};
  animation: ${bounce} 1.4s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay};
`;

const DOT_COLORS = [
  theme.colors.primary,
  '#6B2FE0',
  '#00C9B7',
] as const;

const DOT_DELAYS = ['0s', '0.2s', '0.4s'] as const;

const TypingIndicator: React.FC = () => (
  <IndicatorRow>
    <Bubble>
      {DOT_COLORS.map((color, i) => (
        <Dot key={i} $color={color} $delay={DOT_DELAYS[i]} />
      ))}
    </Bubble>
  </IndicatorRow>
);

export default TypingIndicator;
