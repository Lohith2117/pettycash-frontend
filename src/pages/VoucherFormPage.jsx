import { useState, useEffect } from 'react';
import api from '../api.js';
import { useFetch, useAction } from '../hooks/useFetch.js';
import { Btn, Alert, FormField, Input, Select, PageLoader, StatusBadge } from '../components/UI.jsx';
import SearchableSelect from '../components/SearchableSelect.jsx';
import { theme } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_LINE = { expense_type: '', emp_code: '', emp_name: '', amount: '', line_date: '', invoice_no: '' };

function fmtKWD(n) { return Number(n || 0).toFixed(3); }

export default function VoucherFormPage({ voucherId, onSaved, onCancel }) {
  const { user } = useAuth();
  const isNew = !voucherId;

  const { data: voucher, loading: loadingV } = useFetch(
    () => voucherId ? api.vouchers.get(voucherId) : Promise.resolve(null),
    [voucherId]
  );
  const { data: projects }     = useFetch(api.projects.list);
  const { data: divisions }    = useFetch(api.divisions.list);
  const { data: expTypes }     = useFetch(api.expenseTypes.list);
  const { data: employees }    = useFetch(api.employees.list);
  const action                 = useAction();

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date: today,
    project_code: user?.default_project_code || '',
    project_name: '',
    division: '',
  });
  const [lines, setLines]   = useState([{ ...EMPTY_LINE }]);
  const [files, setFiles]   = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [msg, setMsg]       = useState('');
  const [chargeErrors, setChargeErrors] = useState({});

  // Pre-fill from existing voucher
  useEffect(() => {
    if (!voucher) return;
    setForm({
      date:         voucher.date,
      project_code: voucher.project_code || '',
      project_name: voucher.project_name || '',
      division:     voucher.division || '',
    });
    setLines(voucher.lines?.length ? voucher.lines : [{ ...EMPTY_LINE }]);
    setExistingFiles(voucher.attachments || []);
  }, [voucher]);

  // Auto-fill project name + division when project selected
  useEffect(() => {
    const p = (projects || []).find(p => p.code === form.project_code);
    if (p) {
      setForm(f => ({ ...f, project_name: p.name }));
      const d = (divisions || []).find(d => d.code === p.default_division_code);
      if (d) setForm(f => ({ ...f, division: d.name }));
    }
  }, [form.project_code, projects, divisions]);

  const total = lines.reduce((s, l) => s + Number(l.amount || 0), 0);

  const updateLine = (i, field, value) => {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const addLine = () => setLines(ls => [...ls, { ...EMPTY_LINE }]);
  const removeLine = i => setLines(ls => ls.filter((_, idx) => idx !== i));

  // 9-month cycle validation
  const validateCharge = async (i, line) => {
    const et = (expTypes || []).find(e => e.name === line.expense_type);
    if (!et?.is_employee_linked || !line.emp_code || !line.line_date) return;
    try {
      const res = await api.vouchers.validateCharge({
        emp_code: line.emp_code,
        expense_type: line.expense_type,
        line_date: line.line_date,
      });
      if (!res.allowed) {
        setChargeErrors(e => ({ ...e, [i]: `Not allowed until ${res.next_allowed}` }));
      } else {
        setChargeErrors(e => { const n = { ...e }; delete n[i]; return n; });
      }
    } catch { /* ignore */ }
  };

  const handleSave = async (andSubmit = false) => {
    if (Object.keys(chargeErrors).length) {
      action.run(async () => { throw new Error('Fix 9-month cycle errors before saving'); });
      return;
    }
    await action.run(async () => {
      const body = { ...form, lines };
      let saved;
      if (isNew) {
        saved = await api.vouchers.create(body);
      } else {
        saved = await api.vouchers.update(voucherId, body);
      }

      // Upload files
      if (files.length) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        await api.attachments.upload(saved.id, fd);
      }

      if (andSubmit) {
        await api.vouchers.submit(saved.id);
        setMsg('Voucher submitted for approval!');
      } else {
        setMsg('Voucher saved as Draft.');
      }

      setTimeout(() => onSaved?.(saved.id), 800);
    });
  };

  const handleDeleteAttachment = async (id) => {
    await action.run(async () => {
      await api.attachments.delete(id);
      setExistingFiles(f => f.filter(a => a.id !== id));
    });
  };

  if (loadingV) return <PageLoader />;
  const isDraft = isNew || voucher?.status === 'Draft';

  return (
    <div className="pcs-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: theme.primary }}>
            {isNew ? 'New Voucher' : `Voucher ${voucher?.ref_no}`}
          </h2>
          {voucher && <StatusBadge status={voucher.status} />}
        </div>
        <Btn variant="ghost" onClick={onCancel}>← Back</Btn>
      </div>

      {action.error && <Alert type="error">{action.error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {/* Header */}
      <div style={{ ...theme.card, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, color: theme.primary }}>Voucher Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <FormField label="Date" required>
            <Input type="date" value={form.date} disabled={!isDraft}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>
          <FormField label="Project" required>
            <SearchableSelect
              options={(projects || []).map(p => ({ value: p.code, label: `${p.code} — ${p.name}` }))}
              value={form.project_code}
              onChange={v => setForm(f => ({ ...f, project_code: v }))}
              disabled={!isDraft}
              placeholder="Select project…"
            />
          </FormField>
          <FormField label="Division">
            <Input value={form.division} disabled
              style={{ background: '#f3f4f6' }}
              placeholder="Auto-filled from project"
            />
          </FormField>
        </div>
        <div style={{ fontSize: 13, color: theme.textMuted }}>
          Fund Holder: <strong>{user?.full_name}</strong>
          {user?.employee_code && ` (${user.employee_code})`}
        </div>
      </div>

      {/* Expense Lines */}
      <div style={{ ...theme.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700, color: theme.primary }}>Expense Lines</h3>
          {isDraft && <Btn size="sm" onClick={addLine}>+ Add Line</Btn>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...theme.table, minWidth: 700 }}>
            <thead>
              <tr>
                {['#','Expense Type','Employee','Amount (KWD)','Date','Invoice No',isDraft ? 'Remove' : ''].map(h => (
                  <th key={h} style={{ ...theme.th, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const et = (expTypes || []).find(e => e.name === line.expense_type);
                return (
                  <tr key={i}>
                    <td style={{ ...theme.td, width: 32, color: theme.textMuted }}>{i + 1}</td>
                    <td style={{ ...theme.td, minWidth: 180 }}>
                      {isDraft ? (
                        <SearchableSelect
                          options={(expTypes || []).map(e => ({ value: e.name, label: e.name }))}
                          value={line.expense_type}
                          onChange={v => { updateLine(i, 'expense_type', v); }}
                          placeholder="Select type…"
                        />
                      ) : line.expense_type}
                    </td>
                    <td style={{ ...theme.td, minWidth: 160 }}>
                      {isDraft && et?.is_employee_linked ? (
                        <SearchableSelect
                          options={(employees || []).map(e => ({ value: e.code, label: e.name, sub: e.code }))}
                          value={line.emp_code}
                          onChange={v => {
                            const emp = (employees || []).find(e => e.code === v);
                            updateLine(i, 'emp_code', v);
                            updateLine(i, 'emp_name', emp?.name || '');
                          }}
                          placeholder="Select employee…"
                        />
                      ) : (line.emp_name || '—')}
                      {chargeErrors[i] && (
                        <div style={{ fontSize: 11, color: theme.danger, marginTop: 3 }}>{chargeErrors[i]}</div>
                      )}
                    </td>
                    <td style={{ ...theme.td, minWidth: 120 }}>
                      {isDraft ? (
                        <Input type="number" step="0.001" min="0"
                          value={line.amount}
                          onChange={e => updateLine(i, 'amount', e.target.value)}
                          style={{ fontSize: 13 }}
                        />
                      ) : fmtKWD(line.amount)}
                    </td>
                    <td style={{ ...theme.td, minWidth: 140 }}>
                      {isDraft ? (
                        <Input type="date" value={line.line_date}
                          onChange={e => {
                            updateLine(i, 'line_date', e.target.value);
                            validateCharge(i, { ...line, line_date: e.target.value });
                          }}
                          style={{ fontSize: 13 }}
                        />
                      ) : line.line_date}
                    </td>
                    <td style={{ ...theme.td, minWidth: 120 }}>
                      {isDraft ? (
                        <Input value={line.invoice_no || ''}
                          onChange={e => updateLine(i, 'invoice_no', e.target.value)}
                          style={{ fontSize: 13 }}
                          placeholder="Optional"
                        />
                      ) : (line.invoice_no || '—')}
                    </td>
                    {isDraft && (
                      <td style={theme.td}>
                        <button onClick={() => removeLine(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.danger, fontSize: 16 }}>
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr>
                <td colSpan={isDraft ? 3 : 3} />
                <td colSpan={isDraft ? 4 : 4} style={{ ...theme.td, fontWeight: 700, fontSize: 15, color: theme.primary }}>
                  Total: KWD {fmtKWD(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachments */}
      <div style={{ ...theme.card, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, color: theme.primary, marginBottom: 14 }}>Attachments</h3>
        {existingFiles.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {existingFiles.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px', borderRadius: 6, background: theme.surfaceAlt,
                marginBottom: 6, fontSize: 13,
              }}>
                <span>📎</span>
                <a href={api.attachments.download(a.id)} target="_blank" rel="noreferrer"
                  style={{ color: theme.info, flex: 1 }}>
                  {a.original_name}
                </a>
                <span style={{ color: theme.textMuted }}>{(a.file_size / 1024).toFixed(1)} KB</span>
                {isDraft && (
                  <button onClick={() => handleDeleteAttachment(a.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.danger }}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}
        {isDraft && (
          <label style={{
            display: 'block', border: `2px dashed ${theme.border}`,
            borderRadius: 8, padding: '20px', textAlign: 'center',
            cursor: 'pointer', color: theme.textMuted, fontSize: 14,
          }}>
            <input type="file" multiple style={{ display: 'none' }}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={e => setFiles(Array.from(e.target.files))}
            />
            📁 Click to select files (max 10MB each, up to 10 files)
            {files.length > 0 && (
              <div style={{ marginTop: 8, color: theme.primary, fontWeight: 600 }}>
                {files.length} file(s) selected
              </div>
            )}
          </label>
        )}
      </div>

      {/* Actions */}
      {isDraft && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="ghost" onClick={() => handleSave(false)} loading={action.loading}>
            💾 Save Draft
          </Btn>
          <Btn variant="success" onClick={() => handleSave(true)} loading={action.loading}>
            ✅ Save & Submit
          </Btn>
        </div>
      )}
    </div>
  );
}
