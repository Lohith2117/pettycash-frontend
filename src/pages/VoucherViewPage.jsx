import { useState } from 'react';
import api from '../api.js';
import { useFetch, useAction } from '../hooks/useFetch.js';
import { Btn, Alert, Modal, FormField, Textarea, PageLoader, StatusBadge } from '../components/UI.jsx';
import { theme } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';

function fmtKWD(n) { return `KWD ${Number(n || 0).toFixed(3)}`; }
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14 }}>
      <span style={{ color: theme.textMuted, minWidth: 160 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

// Convert amount to words (KWD)
function amountToWords(n) {
  const num = Number(n || 0);
  const dinars = Math.floor(num);
  const fils   = Math.round((num - dinars) * 1000);

  const ones  = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens  = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function toWords(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
  }

  const d = dinars > 0 ? `${toWords(dinars)} Dinar${dinars !== 1 ? 's' : ''}` : '';
  const f = fils    > 0 ? `${toWords(fils)} Fils` : '';
  return [d, f].filter(Boolean).join(' and ') || 'Zero';
}

export default function VoucherViewPage({ voucherId, onBack, onEdit, onReload }) {
  const { user } = useAuth();
  const { data: voucher, loading, error, reload } = useFetch(() => api.vouchers.get(voucherId), [voucherId]);
  const action = useAction();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason]       = useState('');
  const [showPdf, setShowPdf]                 = useState(false);
  const [msg, setMsg]                         = useState('');

  const doAction = async (fn, successMsg) => {
    await action.run(async () => {
      await fn();
      setMsg(successMsg);
      reload();
      onReload?.();
    });
  };

  if (loading) return <PageLoader />;
  if (!voucher) return <Alert type="error">{error || 'Voucher not found'}</Alert>;

  const v = voucher;
  const canManagerApprove = (user?.is_manager || user?.is_admin) && v.status === 'Submitted';
  const canManagerReject  = canManagerApprove;
  const canCAApprove      = (user?.system_functions?.includes('chief_accountant') || user?.is_admin) && v.status === 'Manager Approved';
  const canCAReject       = canCAApprove;
  const canPay            = (user?.system_functions?.includes('cashier') || user?.is_admin) && v.status === 'Approved';
  const canEdit           = (user?.id === v.created_by_user || user?.is_admin) && v.status === 'Draft';
  const canSubmit         = canEdit;

  return (
    <div className="pcs-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: theme.primary }}>{v.ref_no}</h2>
            <StatusBadge status={v.status} />
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>Created: {v.date}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="ghost" onClick={onBack}>← Back</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setShowPdf(true)}>🖨 PDF Preview</Btn>
          {canEdit && <Btn size="sm" onClick={() => onEdit?.(v.id)}>✏️ Edit</Btn>}
          {canSubmit && (
            <Btn variant="success" size="sm"
              onClick={() => doAction(() => api.vouchers.submit(v.id), 'Submitted for approval!')}>
              ✅ Submit
            </Btn>
          )}
          {canManagerApprove && (
            <Btn variant="success" size="sm"
              onClick={() => doAction(() => api.vouchers.managerApprove(v.id), 'Approved!')}>
              ✅ Mgr Approve
            </Btn>
          )}
          {canManagerReject && (
            <Btn variant="danger" size="sm" onClick={() => setShowRejectModal('manager')}>
              ✕ Mgr Reject
            </Btn>
          )}
          {canCAApprove && (
            <Btn variant="success" size="sm"
              onClick={() => doAction(() => api.vouchers.approve(v.id), 'Approved by Chief Accountant!')}>
              ✅ CA Approve
            </Btn>
          )}
          {canCAReject && (
            <Btn variant="danger" size="sm" onClick={() => setShowRejectModal('ca')}>
              ✕ CA Reject
            </Btn>
          )}
          {canPay && (
            <Btn variant="secondary" size="sm"
              onClick={() => doAction(() => api.vouchers.pay(v.id), 'Marked as Paid!')}>
              💰 Mark Paid
            </Btn>
          )}
        </div>
      </div>

      {action.error && <Alert type="error">{action.error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={theme.card}>
          <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 14 }}>Fund Holder</h3>
          <InfoRow label="Name"          value={v.holder_name} />
          <InfoRow label="Employee Code" value={v.holder_emp_code} />
          <InfoRow label="Division"      value={v.division} />
          <InfoRow label="Project"       value={`${v.project_code} — ${v.project_name}`} />
        </div>
        <div style={theme.card}>
          <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 14 }}>Approval Trail</h3>
          <InfoRow label="Submitted"        value={v.submitted_date} />
          <InfoRow label="Manager Approved" value={v.manager_approved_name ? `${v.manager_approved_name} (${v.manager_approved_date})` : null} />
          <InfoRow label="CA Approved"      value={v.approved_name ? `${v.approved_name} (${v.approved_date})` : null} />
          <InfoRow label="Paid By"          value={v.paid_name ? `${v.paid_name} (${v.paid_date})` : null} />
          {v.reject_reason && <InfoRow label="Reject Reason" value={v.reject_reason} />}
        </div>
      </div>

      {/* Lines table */}
      <div style={{ ...theme.card, marginBottom: 16, overflowX: 'auto' }}>
        <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 14 }}>Expense Lines</h3>
        <table style={theme.table}>
          <thead>
            <tr>
              {['#','Expense Type','Employee','Amount','Date','Invoice No'].map(h => (
                <th key={h} style={theme.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(v.lines || []).map((l, i) => (
              <tr key={l.id}>
                <td style={{ ...theme.td, color: theme.textMuted }}>{i + 1}</td>
                <td style={theme.td}>{l.expense_type}</td>
                <td style={theme.td}>{l.emp_name ? `${l.emp_name} (${l.emp_code})` : '—'}</td>
                <td style={{ ...theme.td, fontWeight: 600 }}>{fmtKWD(l.amount)}</td>
                <td style={theme.td}>{l.line_date}</td>
                <td style={theme.td}>{l.invoice_no || '—'}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} />
              <td colSpan={3} style={{ ...theme.td, fontWeight: 700, fontSize: 15, color: theme.primary }}>
                {fmtKWD(v.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attachments */}
      {(v.attachments || []).length > 0 && (
        <div style={theme.card}>
          <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 12 }}>Attachments</h3>
          {v.attachments.map(a => (
            <a key={a.id}
              href={api.attachments.download(a.id)}
              target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px', borderRadius: 6, background: theme.surfaceAlt,
                marginBottom: 6, fontSize: 13, color: theme.info, textDecoration: 'none',
              }}
            >
              📎 {a.original_name}
              <span style={{ color: theme.textMuted, marginLeft: 'auto' }}>{(a.file_size / 1024).toFixed(1)} KB</span>
            </a>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal title="Reason for Rejection" onClose={() => setShowRejectModal(false)} width={420}>
          <FormField label="Rejection Reason">
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide a reason (optional)" />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Btn>
            <Btn variant="danger" loading={action.loading}
              onClick={() => doAction(
                () => showRejectModal === 'manager'
                  ? api.vouchers.managerReject(v.id, { reason: rejectReason })
                  : api.vouchers.reject(v.id, { reason: rejectReason }),
                'Voucher rejected.'
              ).then(() => setShowRejectModal(false))}
            >
              Confirm Reject
            </Btn>
          </div>
        </Modal>
      )}

      {/* PDF Preview Modal */}
      {showPdf && (
        <Modal title={`PDF Preview — ${v.ref_no}`} onClose={() => setShowPdf(false)} width={780}>
          <PdfPreview voucher={v} />
        </Modal>
      )}
    </div>
  );
}

// ── PDF Preview Component ─────────────────────────────────────────
function PdfPreview({ voucher: v }) {
  const total = Number(v.total || 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#111', padding: 8 }}
      id="pdf-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.primary }}>AL-Dhow Group</div>
          <div style={{ fontSize: 11, color: theme.textMuted }}>Petty Cash Settlement Voucher</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{v.ref_no}</div>
          <div style={{ fontSize: 11 }}>Date: {v.date}</div>
          <StatusBadge status={v.status} />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 12 }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 8px', background: '#f1f4f9', fontWeight: 600, width: '20%' }}>Fund Holder</td>
            <td style={{ padding: '5px 8px', width: '30%' }}>{v.holder_name}</td>
            <td style={{ padding: '5px 8px', background: '#f1f4f9', fontWeight: 600, width: '20%' }}>Employee Code</td>
            <td style={{ padding: '5px 8px' }}>{v.holder_emp_code || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#f1f4f9', fontWeight: 600 }}>Division</td>
            <td style={{ padding: '5px 8px' }}>{v.division}</td>
            <td style={{ padding: '5px 8px', background: '#f1f4f9', fontWeight: 600 }}>Project</td>
            <td style={{ padding: '5px 8px' }}>{v.project_code}</td>
          </tr>
        </tbody>
      </table>

      {/* Lines */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 12 }}>
        <thead>
          <tr style={{ background: theme.primary, color: '#fff' }}>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Expense Type</th>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Employee</th>
            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount (KWD)</th>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {(v.lines || []).map((l, i) => (
            <tr key={l.id} style={{ background: i % 2 ? '#f8f9fb' : '#fff' }}>
              <td style={{ padding: '5px 8px' }}>{i + 1}</td>
              <td style={{ padding: '5px 8px' }}>{l.expense_type}</td>
              <td style={{ padding: '5px 8px' }}>{l.emp_name || '—'}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{Number(l.amount).toFixed(3)}</td>
              <td style={{ padding: '5px 8px' }}>{l.line_date}</td>
              <td style={{ padding: '5px 8px' }}>{l.invoice_no || '—'}</td>
            </tr>
          ))}
          <tr style={{ background: '#f1f4f9', fontWeight: 700 }}>
            <td colSpan={3} style={{ padding: '7px 8px', textAlign: 'right' }}>TOTAL</td>
            <td style={{ padding: '7px 8px', textAlign: 'right', color: theme.primary }}>{total.toFixed(3)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 12, marginBottom: 16, fontStyle: 'italic', color: theme.textMuted }}>
        Amount in words: <strong style={{ color: theme.text }}>{amountToWords(total)} Kuwaiti Dinar</strong>
      </div>

      {/* Signatures */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <tbody>
          {[
            ['Prepared by / Fund Holder', v.holder_name, v.submitted_date],
            ['Reviewed by / Manager', v.manager_approved_name, v.manager_approved_date],
            ['Reviewed by / Chief Accountant', v.approved_name, v.approved_date],
            ['Approved by', '', ''],
            ['Received by / Cashier', v.paid_name, v.paid_date],
            ['Received & Settled / Fund Holder', v.holder_name, v.paid_date],
          ].map(([role, name, date], i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #ccc', padding: '10px 8px', width: '30%', background: '#f8f9fb', fontWeight: 600 }}>{role}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px 8px', width: '40%' }}>{name || ''}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px 8px', width: '30%', color: theme.textMuted }}>{date || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <button onClick={() => window.print()}
          style={{ ...theme.btn.base, ...theme.btn.primary, padding: '8px 24px' }}>
          🖨 Print
        </button>
      </div>
    </div>
  );
}

// function amountToWords(n) {
//   const num = Number(n || 0);
//   const dinars = Math.floor(num);
//   const fils   = Math.round((num - dinars) * 1000);
//   const ones   = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
//     'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
//   const tens   = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
//   function toWords(n) {
//     if (n === 0) return '';
//     if (n < 20) return ones[n];
//     if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? ' ' + ones[n % 10] : '');
//     return ones[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
//   }
//   const d = dinars > 0 ? `${toWords(dinars)} Dinar${dinars !== 1 ? 's' : ''}` : '';
//   const f = fils > 0 ? `${toWords(fils)} Fils` : '';
//   return [d, f].filter(Boolean).join(' and ') || 'Zero';
// }
