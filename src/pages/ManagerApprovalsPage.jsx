import { useState, useMemo } from 'react';
import api from '../api.js';
import { useFetch, useAction } from '../hooks/useFetch.js';
import { Btn, Alert, Modal, FormField, Textarea, StatusBadge, PageLoader, Empty } from '../components/UI.jsx';
import { theme } from '../theme.js';

function fmtKWD(n) { return `KWD ${Number(n || 0).toFixed(3)}`; }

const PAGE_SIZE = 20;

export default function ManagerApprovalsPage({ onSelectVoucher }) {
  const { data: vouchers, loading, error, reload } = useFetch(api.vouchers.list);
  const action = useAction();

  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason]           = useState('');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [msg, setMsg]                 = useState('');

  const pending   = useMemo(() => (vouchers || []).filter(v => v.status === 'Submitted'), [vouchers]);
  const processed = useMemo(() => (vouchers || [])
    .filter(v => ['Manager Approved','Approved','Paid','Rejected'].includes(v.status))
    .sort((a, b) => new Date(b.manager_approved_date || b.updated_at) - new Date(a.manager_approved_date || a.updated_at)),
    [vouchers]
  );

  const filteredProcessed = useMemo(() => {
    if (!search) return processed;
    const q = search.toLowerCase();
    return processed.filter(v =>
      v.ref_no.toLowerCase().includes(q) ||
      v.holder_name.toLowerCase().includes(q) ||
      v.project_code?.toLowerCase().includes(q)
    );
  }, [processed, search]);

  const totalPages = Math.ceil(filteredProcessed.length / PAGE_SIZE);
  const paginated  = filteredProcessed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const doApprove = async (id) => {
    await action.run(async () => {
      await api.vouchers.managerApprove(id);
      setMsg('Voucher approved!');
      reload();
    });
  };

  const doReject = async () => {
    await action.run(async () => {
      await api.vouchers.managerReject(rejectModal.id, { reason });
      setMsg('Voucher returned to Draft.');
      setRejectModal(null);
      setReason('');
      reload();
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="pcs-fade">
      {error && <Alert type="error">{error}</Alert>}
      {action.error && <Alert type="error">{action.error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {/* ── Pending Approvals ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: theme.primary }}>
          Pending Approvals
          {pending.length > 0 && (
            <span style={{
              marginLeft: 10, fontSize: 13, fontWeight: 700,
              background: theme.danger, color: '#fff',
              borderRadius: 999, padding: '2px 9px',
            }}>{pending.length}</span>
          )}
        </h2>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 28, overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>
              {['Ref No','Date','Holder','Project','Division','Total','Submitted','Actions'].map(h => (
                <th key={h} style={theme.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!pending.length && (
              <tr><td colSpan={8}><Empty message="No vouchers pending your approval" /></td></tr>
            )}
            {pending.map(v => (
              <tr key={v.id}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={theme.td}>
                  <button onClick={() => onSelectVoucher?.(v.id)}
                    style={{ background: 'none', border: 'none', color: theme.info, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                    {v.ref_no}
                  </button>
                </td>
                <td style={theme.td}>{v.date}</td>
                <td style={theme.td}>{v.holder_name}</td>
                <td style={theme.td}><span style={{ fontSize: 12 }}>{v.project_code}</span></td>
                <td style={theme.td}>{v.division}</td>
                <td style={{ ...theme.td, fontWeight: 700 }}>{fmtKWD(v.total)}</td>
                <td style={theme.td}>{v.submitted_date}</td>
                <td style={theme.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="success" size="sm" onClick={() => doApprove(v.id)} loading={action.loading}>
                      ✅ Approve
                    </Btn>
                    <Btn variant="danger" size="sm" onClick={() => { setRejectModal(v); setReason(''); }}>
                      ✕ Reject
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Processed History ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: theme.primary }}>Approval History</h2>
        <input
          placeholder="Search ref, holder, project…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...theme.input, maxWidth: 280 }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>
              {['Ref No','Date','Holder','Project','Total','Status','Approved/Rejected Date'].map(h => (
                <th key={h} style={theme.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!paginated.length && (
              <tr><td colSpan={7}><Empty message="No processed vouchers yet" /></td></tr>
            )}
            {paginated.map(v => (
              <tr key={v.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectVoucher?.(v.id)}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={{ ...theme.td, fontWeight: 600 }}>{v.ref_no}</td>
                <td style={theme.td}>{v.date}</td>
                <td style={theme.td}>{v.holder_name}</td>
                <td style={theme.td}>{v.project_code}</td>
                <td style={{ ...theme.td, fontWeight: 600 }}>{fmtKWD(v.total)}</td>
                <td style={theme.td}><StatusBadge status={v.status} /></td>
                <td style={theme.td}>{v.manager_approved_date || v.rejected_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '14px 0', borderTop: `1px solid ${theme.border}` }}>
            <Btn variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</Btn>
            <span style={{ padding: '5px 12px', fontSize: 13, color: theme.textMuted }}>
              Page {page} of {totalPages}
            </span>
            <Btn variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ›</Btn>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title={`Reject Voucher — ${rejectModal.ref_no}`} onClose={() => setRejectModal(null)} width={420}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <Alert type="warning">
            This will return the voucher to <strong>Draft</strong> status. The fund holder can edit and resubmit.
          </Alert>
          <FormField label="Reason (optional)">
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe why this voucher is being returned…"
              autoFocus
            />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={doReject} loading={action.loading}>Confirm Reject</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
