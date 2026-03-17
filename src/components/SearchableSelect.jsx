import { useState, useRef, useEffect } from 'react';
import { theme } from '../theme.js';

/**
 * SearchableSelect
 * Props:
 *   options   – [{ value, label, sub }]   sub = optional secondary text
 *   value     – current value
 *   onChange  – (value) => void
 *   placeholder
 *   disabled
 *   style
 */
export function SearchableSelect({ options = [], value, onChange, placeholder = 'Select…', disabled, style }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);

  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub || '').toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          ...theme.input,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
          background: disabled ? '#f3f4f6' : '#fff',
        }}
      >
        <span style={{ color: selected ? theme.text : theme.textMuted, fontSize: 14 }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ color: theme.textMuted, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: `1px solid ${theme.border}`,
          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${theme.border}` }}>
            <input
              autoFocus
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ ...theme.input, fontSize: 13 }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', color: theme.textMuted, fontSize: 13 }}>No results</div>
            )}
            {filtered.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setQuery(''); setOpen(false); }}
                style={{
                  padding: '9px 14px',
                  cursor: 'pointer',
                  background: opt.value === value ? theme.infoBg : 'transparent',
                  borderBottom: `1px solid ${theme.border}`,
                  fontSize: 14,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = opt.value === value ? theme.infoBg : 'transparent'}
              >
                <div style={{ fontWeight: opt.value === value ? 600 : 400 }}>{opt.label}</div>
                {opt.sub && <div style={{ fontSize: 12, color: theme.textMuted }}>{opt.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
