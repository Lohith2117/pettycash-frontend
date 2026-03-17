// ── Centralized theme — all inline styles derive from here ────────
export const theme = {
  // Brand colours
  primary:      '#1a3a6b',   // deep navy
  primaryHover: '#14306e',
  secondary:    '#c9a84c',   // gold accent
  bg:           '#f4f6f9',
  surface:      '#ffffff',
  surfaceAlt:   '#f8f9fb',
  border:       '#dde2ec',
  text:         '#1a1a2e',
  textMuted:    '#6b7280',
  danger:       '#dc2626',
  dangerBg:     '#fef2f2',
  success:      '#16a34a',
  successBg:    '#f0fdf4',
  warning:      '#d97706',
  warningBg:    '#fffbeb',
  info:         '#2563eb',
  infoBg:       '#eff6ff',

  // Status colours
  status: {
    Draft:             { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
    Submitted:         { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
    'Manager Approved':{ bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    Approved:          { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    Paid:              { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
    Rejected:          { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  },

  // Shared component styles
  card: {
    background: '#ffffff',
    borderRadius: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    padding: '24px',
  },

  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #dde2ec',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    color: '#1a1a2e',
  },

  btn: {
    base: {
      padding: '8px 18px',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 14,
      transition: 'opacity 0.15s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    },
    primary: { background: '#1a3a6b', color: '#fff' },
    secondary: { background: '#c9a84c', color: '#fff' },
    danger:   { background: '#dc2626', color: '#fff' },
    success:  { background: '#16a34a', color: '#fff' },
    ghost:    { background: 'transparent', color: '#1a3a6b', border: '1px solid #1a3a6b' },
    sm: { padding: '5px 12px', fontSize: 13 },
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },

  th: {
    padding: '10px 14px',
    background: '#f1f4f9',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #dde2ec',
    color: '#374151',
    fontSize: 13,
  },

  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #f0f2f7',
    verticalAlign: 'middle',
  },
};

export default theme;
