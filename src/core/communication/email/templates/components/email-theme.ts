/**
 * Every colour, size and spacing value an email uses.
 *
 * The one file a rebrand touches. Templates compose components and never write
 * raw styles, so nothing outside `components/` has an opinion about appearance —
 * which is what keeps forty templates looking like one product.
 *
 * Values are deliberately plain: no CSS variables, no `rem`, no media queries.
 * Outlook renders through Word's HTML engine and supports none of them, and a
 * value that silently falls back is worse than a value that is simply fixed.
 */
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
    /* No webfont: Gmail strips @font-face, so a stack that exists on the device
     * is the only thing that renders the same everywhere. */
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

  /* Wider than this and the line length becomes hard to read on desktop; the
   * container is fluid below it, so phones are unaffected. */
  maxWidth: '560px',
} as const;
