import { theme } from '../theme.js';

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 20, color = theme.primary }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}22`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// ── Button ────────────────────────────────────────────────────────
export function Btn({ variant = 'primary', size, children, style, disabled, loading, ...props }) {
  const base  = { ...theme.btn.base, ...(size === 'sm' ? theme.btn.sm : {}) };
  const color = theme.btn[variant] || theme.btn.primary;
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{ ...base, ...color, opacity: (disabled || loading) ? 0.6 : 1, ...style }}
    >
      {loading ? <Spinner size={14} color="#fff" /> : null}
      {children}
    </button>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const s = theme.status[status] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 999,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontWeight: 600,
      fontSize: 12,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}
    onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{
        background: '#fff', borderRadius: 10, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: `1px solid ${theme.border}`,
        }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: theme.primary }}>{title}</h3>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: theme.textMuted, lineHeight: 1,
            }}>×</button>
          )}
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Alert / error box ─────────────────────────────────────────────
export function Alert({ type = 'error', children }) {
  const styles = {
    error:   { bg: theme.dangerBg,  color: theme.danger,  border: '#fca5a5' },
    success: { bg: theme.successBg, color: theme.success, border: '#86efac' },
    warning: { bg: theme.warningBg, color: theme.warning, border: '#fde68a' },
    info:    { bg: theme.infoBg,    color: theme.info,    border: '#93c5fd' },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 6,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 14, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────
export function FormField({ label, required, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5, color: theme.text }}>
          {label}{required && <span style={{ color: theme.danger }}> *</span>}
        </label>
      )}
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ style, ...props }) {
  return <input style={{ ...theme.input, ...style }} {...props} />;
}

// ── Select ────────────────────────────────────────────────────────
export function Select({ style, children, ...props }) {
  return (
    <select style={{ ...theme.input, ...style }} {...props}>
      {children}
    </select>
  );
}

// ── Textarea ──────────────────────────────────────────────────────
export function Textarea({ style, ...props }) {
  return <textarea style={{ ...theme.input, minHeight: 80, resize: 'vertical', ...style }} {...props} />;
}

// ── Page loading skeleton ─────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <Spinner size={36} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────
export function Empty({ message = 'No records found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: theme.textMuted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 15 }}>{message}</div>
    </div>
  );
}

// ── CSS animation injection (once) ───────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('pcs-anim')) {
  const s = document.createElement('style');
  s.id = 'pcs-anim';
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .pcs-fade { animation: fadeIn 0.2s ease; }
  `;
  document.head.appendChild(s);
}
