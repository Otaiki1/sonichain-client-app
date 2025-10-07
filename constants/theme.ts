export const theme = {
  colors: {
    primary: '#00CFFF',
    secondary: '#A020F0',
    accent: '#16A349',
    background: '#0D0F1A',
    cardBackground: '#1A1D2E',
    text: '#FFFFFF',
    textSecondary: '#A0A0B0',
    border: '#2A2D3E',
    error: '#FF4444',
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
