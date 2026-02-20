import styled from 'styled-components';
import { theme } from '@/features/theme';

export const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.md};
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  }
`;

export const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: 12px;
`;

export const CardContent = styled.div`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;
