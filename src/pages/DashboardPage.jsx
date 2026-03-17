import { useState, useMemo } from 'react';
import api from '../api.js';
import { useFetch } from '../hooks/useFetch.js';
import { StatusBadge, PageLoader, Alert, Empty } from '../components/UI.jsx';
import { theme } from '../theme.js';

const STATUSES = ['Draft','Submitted','Manager Approved','Approved','Paid','Rejected'];

function fmtKWD(n) {
  return `KWD ${Number(n || 0).toFixed(3)}`;
}

function StatBox({ label, count, amount, active, onClick, status }) {
  const s = theme.status[status] || {};
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? s.bg || theme.infoBg : '#fff',
        border: `2px solid ${active ? s.border || theme.info : theme.border}`,
        borderRadius: 10, padding: '16px 20px', cursor: 'pointer',
        transition: 'all 0.15s', flex: '1 1 140px', minWidth: 130,
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color: s.color || theme.primary }}>{count}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: s.color || theme.textMuted }}>{fmtKWD(amount)}</div>
    </div>
  );
}

export default function DashboardPage({ onSelectVoucher }) {
  const { data: vouchers, loading, error, reload } = useFetch(api.vouchers.list);
  const [activeStatus, setActiveStatus] = useState(null);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const m = {};
    STATUSES.forEach(s => { m[s] = { count: 0, amount: 0 }; });
    (vouchers || []).forEach(v => {
      if (m[v.status]) {
        m[v.status].count++;
        m[v.status].amount += Number(v.total || 0);
      }
    });
    return m;
  }, [vouchers]);

  const filtered = useMemo(() => {
    let list = vouchers || [];
    if (activeStatus) list = list.filter(v => v.status === activeStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.ref_no?.toLowerCase().includes(q) ||
        v.holder_name?.toLowerCase().includes(q) ||
        v.project_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vouchers, activeStatus, search]);

  if (loading) return <PageLoader />;

  return (
    <div className="pcs-fade">
      {error && <Alert type="error">{error}</Alert>}

      {/* Stat boxes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <StatBox
          label="All"
          count={vouchers?.length || 0}
          amount={(vouchers || []).reduce((s, v) => s + Number(v.total || 0), 0)}
          active={activeStatus === null}
          onClick={() => setActiveStatus(null)}
          status="Approved"
        />
        {STATUSES.map(s => (
          <StatBox
            key={s}
            label={s}
            count={stats[s].count}
            amount={stats[s].amount}
            active={activeStatus === s}
            onClick={() => setActiveStatus(s === activeStatus ? null : s)}
            status={s}
          />
        ))}
      </div>

      {/* Search + table */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            placeholder="Search by ref, holder, project…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...theme.input, maxWidth: 320 }}
          />
          <span style={{ color: theme.textMuted, fontSize: 13 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={theme.table}>
            <thead>
              <tr>
                {['Ref No','Date','Holder','Project','Division','Total','Status','Submitted'].map(h => (
                  <th key={h} style={theme.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8}><Empty message="No vouchers found" /></td></tr>
              )}
              {filtered.map(v => (
                <tr
                  key={v.id}
                  onClick={() => onSelectVoucher?.(v.id)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={theme.td}><strong>{v.ref_no}</strong></td>
                  <td style={theme.td}>{v.date}</td>
                  <td style={theme.td}>{v.holder_name}</td>
                  <td style={theme.td}><span style={{ fontSize: 12 }}>{v.project_code}</span></td>
                  <td style={theme.td}>{v.division}</td>
                  <td style={theme.td}>{fmtKWD(v.total)}</td>
                  <td style={theme.td}><StatusBadge status={v.status} /></td>
                  <td style={theme.td}>{v.submitted_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
