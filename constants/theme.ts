export const theme = {
  colors: {
    primary: '#FF2E63',
    secondary: '#FF6B9D',
    accent: '#00FFFF',
    background: '#1A0E14',
    cardBackground: '#2A1520',
    text: '#FFFFFF',
    textSecondary: '#D4A5B8',
    border: '#3D1F2E',
    error: '#FF4444',
    success: '#28FFBF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 38,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 29,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
  },
};
