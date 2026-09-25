export const EMAIL_THEME = {
  color: {
    page: '#f4f5f7',
    surface: '#ffffff',
    border: '#e3e5e9',
    text: '#16191d',
    muted: '#6b7280',
    accent: '#2563eb',
    onAccent: '#ffffff',
  },

  font: {
    family:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Noto Sans', sans-serif",
    mono: "'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    size: {
      body: '15px',
      small: '13px',
      code: '32px',
      brand: '18px',
    },
  },

  space: {
    xs: '8px',
    sm: '12px',
    md: '20px',
    lg: '32px',
  },

  radius: '10px',

  maxWidth: '560px',
} as const;
