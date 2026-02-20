export const theme = {
  colors: {
    primary: '#4318FF',
    primaryHover: '#3610DB',
    primaryActive: '#2D0DB8',
    gradient: 'linear-gradient(135deg, #4318FF 0%, #00C9B7 100%)',
    surface: '#FFFFFF',
    background: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    userBubble: '#4318FF',
    assistantBubble: '#F0F1F5',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
    success: '#10B981',
    streaming: '#4318FF',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    pill: '9999px',
  },
  fontFamily:
    "fkGroteskNeue, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', 'Yu Gothic', 'Microsoft YaHei', 'Microsoft JhengHei', Meiryo",
} as const;

export type Theme = typeof theme;
