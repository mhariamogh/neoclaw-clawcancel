export const theme = {
  colors: {
    primary: '#4318FF',
    primaryHover: '#3610DB',
    primaryActive: '#2D0DB8',
    gradient: 'linear-gradient(135deg, #4318FF 0%, #00C9B7 100%)',
    accent: '#00C9B7',
    surface: '#F9FAFB',
    surfaceElevated: '#F3F4F6',
    background: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    userBubble: '#4318FF',
    assistantBubble: '#F3F4F6',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    info: '#2563EB',
    infoBg: '#EFF6FF',
    success: '#16A34A',
    successBg: '#F0FDF4',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    streaming: '#4318FF',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    pill: '9999px',
  },
  fontFamily:
    "fkGroteskNeue, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
} as const;

export type Theme = typeof theme;
