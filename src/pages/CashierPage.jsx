import { useState } from 'react';
import api from '../api.js';
import { useFetch, useAction } from '../hooks/useFetch.js';
import { Btn, Alert, Modal, FormField, Input, Textarea, StatusBadge, PageLoader, Empty } from '../components/UI.jsx';
import { theme } from '../theme.js';

function fmtKWD(n) { return `KWD ${Number(n || 0).toFixed(3)}`; }

export default function CashierPage({ onSelectVoucher }) {
  const [tab, setTab] = useState('queue');

  const tabs = [
    { id: 'queue',   label: '💰 Refund Queue' },
    { id: 'funding', label: '📥 Fund Allocation' },
    { id: 'closing', label: '📤 Fund Closing' },
  ];

  return (
    <div className="pcs-fade">
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${theme.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '9px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              color: tab === t.id ? theme.primary : theme.textMuted,
              borderBottom: tab === t.id ? `2px solid ${theme.primary}` : '2px solid transparent',
              marginBottom: -2,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'queue'   && <RefundQueue onSelectVoucher={onSelectVoucher} />}
      {tab === 'funding' && <FundingTab />}
      {tab === 'closing' && <ClosingTab />}
    </div>
  );
}

// ── Refund Queue ──────────────────────────────────────────────────
function RefundQueue({ onSelectVoucher }) {
  const { data: vouchers, loading, error, reload } = useFetch(api.vouchers.list);
  const action = useAction();
  const [search, setSearch] = useState('');

  const approved = (vouchers || []).filter(v => v.status === 'Approved');
  const recentPaid = (vouchers || [])
    .filter(v => v.status === 'Paid')
    .sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date))
    .slice(0, 20);

  const filteredPaid = recentPaid.filter(v =>
    !search || v.ref_no.includes(search) || v.holder_name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePay = async (id) => {
    await action.run(async () => { await api.vouchers.pay(id); reload(); });
  };

  if (loading) return <PageLoader />;

  return (
    <>
      {action.error && <Alert type="error">{action.error}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 12 }}>
        Pending Payment ({approved.length})
      </h3>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24, overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>{['Ref No','Date','Holder','Project','Total','Action'].map(h => <th key={h} style={theme.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {!approved.length && <tr><td colSpan={6}><Empty message="No approved vouchers pending payment" /></td></tr>}
            {approved.map(v => (
              <tr key={v.id}>
                <td style={theme.td}>
                  <button onClick={() => onSelectVoucher?.(v.id)}
                    style={{ background: 'none', border: 'none', color: theme.info, cursor: 'pointer', fontWeight: 600 }}>
                    {v.ref_no}
                  </button>
                </td>
                <td style={theme.td}>{v.date}</td>
                <td style={theme.td}>{v.holder_name}</td>
                <td style={theme.td}>{v.project_code}</td>
                <td style={{ ...theme.td, fontWeight: 700 }}>{fmtKWD(v.total)}</td>
                <td style={theme.td}>
                  <Btn variant="success" size="sm" onClick={() => handlePay(v.id)} loading={action.loading}>
                    💰 Mark Paid
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 12 }}>
        Recently Paid (last 20)
      </h3>
      <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...theme.input, maxWidth: 280, marginBottom: 12 }} />
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>{['Ref No','Holder','Total','Paid Date'].map(h => <th key={h} style={theme.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {!filteredPaid.length && <tr><td colSpan={4}><Empty /></td></tr>}
            {filteredPaid.map(v => (
              <tr key={v.id}>
                <td style={theme.td}>
                  <button onClick={() => onSelectVoucher?.(v.id)}
                    style={{ background: 'none', border: 'none', color: theme.info, cursor: 'pointer', fontWeight: 600 }}>
                    {v.ref_no}
                  </button>
                </td>
                <td style={theme.td}>{v.holder_name}</td>
                <td style={{ ...theme.td, fontWeight: 600 }}>{fmtKWD(v.total)}</td>
                <td style={theme.td}>{v.paid_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Funding Tab ───────────────────────────────────────────────────
function FundingTab() {
  const { data: holders, loading, error, reload } = useFetch(api.funding.fundHolders);
  const action = useAction();
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount]   = useState('');
  const [notes, setNotes]     = useState('');
  const [txModal, setTxModal] = useState(null);
  const { data: txns }        = useFetch(
    () => txModal ? api.funding.transactions(txModal.id) : Promise.resolve([]),
    [txModal?.id]
  );

  const filtered = (holders || []).filter(h =>
    !search || h.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const doFund = async () => {
    await action.run(async () => {
      await api.funding.fund({ fund_holder_id: selected.id, amount: Number(amount), notes });
      setModal(null); setAmount(''); setNotes('');
      reload();
    });
  };

  if (loading) return <PageLoader />;
  return (
    <>
      {action.error && <Alert type="error">{action.error}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <input placeholder="Search fund holders…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...theme.input, maxWidth: 300, marginBottom: 14 }} />

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>{['Name','Emp Code','Limit','Balance','Status','Actions'].map(h => <th key={h} style={theme.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {!filtered.length && <tr><td colSpan={6}><Empty /></td></tr>}
            {filtered.map(h => (
              <tr key={h.id}>
                <td style={theme.td}><strong>{h.full_name}</strong></td>
                <td style={theme.td}>{h.employee_code || '—'}</td>
                <td style={theme.td}>{fmtKWD(h.fund_limit)}</td>
                <td style={{ ...theme.td, fontWeight: 700, color: Number(h.balance) < 0 ? theme.danger : theme.success }}>
                  {fmtKWD(h.balance)}
                </td>
                <td style={theme.td}>
                  <span style={{ color: h.fund_active ? theme.success : theme.textMuted, fontWeight: 600 }}>
                    {h.fund_active ? '● Active' : '○ Inactive'}
                  </span>
                </td>
                <td style={theme.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" onClick={() => { setSelected(h); setModal('fund'); }}>+ Fund</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setTxModal(h)}>History</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'fund' && (
        <Modal title={`Fund — ${selected?.full_name}`} onClose={() => setModal(null)} width={400}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <FormField label="Amount (KWD)" required>
            <Input type="number" step="0.001" min="0.001" value={amount}
              onChange={e => setAmount(e.target.value)} autoFocus />
          </FormField>
          <FormField label="Notes">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doFund} loading={action.loading}>Allocate Funds</Btn>
          </div>
        </Modal>
      )}

      {txModal && (
        <Modal title={`Transaction History — ${txModal.full_name}`} onClose={() => setTxModal(null)} width={560}>
          <table style={theme.table}>
            <thead>
              <tr>{['Type','Amount','By','Date','Notes'].map(h => <th key={h} style={theme.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(txns || []).length === 0 && <tr><td colSpan={5}><Empty /></td></tr>}
              {(txns || []).map(t => (
                <tr key={t.id}>
                  <td style={theme.td}>
                    <span style={{ color: t.type === 'funding' ? theme.success : theme.danger, fontWeight: 600, textTransform: 'capitalize' }}>
                      {t.type === 'funding' ? '▲' : '▼'} {t.type}
                    </span>
                  </td>
                  <td style={{ ...theme.td, fontWeight: 600 }}>{fmtKWD(t.amount)}</td>
                  <td style={theme.td}>{t.performed_by_name}</td>
                  <td style={theme.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={theme.td}>{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}

// ── Fund Closing Tab ──────────────────────────────────────────────
function ClosingTab() {
  const { data: holders, loading, error, reload } = useFetch(api.funding.fundHolders);
  const action = useAction();
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [notes, setNotes]    = useState('');

  const active = (holders || []).filter(h =>
    h.fund_active && (!search || h.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  const doClose = async () => {
    await action.run(async () => {
      await api.funding.close({ fund_holder_id: confirm.id, notes });
      setConfirm(null); setNotes('');
      reload();
    });
  };

  if (loading) return <PageLoader />;
  return (
    <>
      {action.error && <Alert type="error">{action.error}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <input placeholder="Search active fund holders…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...theme.input, maxWidth: 300, marginBottom: 14 }} />
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>{['Name','Emp Code','Balance','Action'].map(h => <th key={h} style={theme.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {!active.length && <tr><td colSpan={4}><Empty message="No active funds" /></td></tr>}
            {active.map(h => (
              <tr key={h.id}>
                <td style={theme.td}><strong>{h.full_name}</strong></td>
                <td style={theme.td}>{h.employee_code || '—'}</td>
                <td style={{ ...theme.td, fontWeight: 700 }}>{fmtKWD(h.balance)}</td>
                <td style={theme.td}>
                  <Btn variant="danger" size="sm" onClick={() => { setConfirm(h); setNotes(''); }}>
                    Close Fund
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirm && (
        <Modal title={`Close Fund — ${confirm.full_name}`} onClose={() => setConfirm(null)} width={420}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <Alert type="warning">
            Remaining balance of <strong>{fmtKWD(confirm.balance)}</strong> will be recovered.
            Pending vouchers will block closure.
          </Alert>
          <FormField label="Notes">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={doClose} loading={action.loading}>Confirm Close</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
