import { useState } from 'react';
import api from '../api.js';
import { useFetch, useAction } from '../hooks/useFetch.js';
import { Btn, Alert, Modal, FormField, Input, Select, PageLoader, Empty } from '../components/UI.jsx';
import SearchableSelect from '../components/SearchableSelect.jsx';
import { theme } from '../theme.js';

// ── Generic Master CRUD Table ─────────────────────────────────────
function MasterTable({ title, columns, rows, loading, error, onAdd, onEdit, onToggle }) {
  return (
    <div className="pcs-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: theme.primary }}>{title}</h2>
        <Btn size="sm" onClick={onAdd}>+ Add New</Btn>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        {loading ? <PageLoader /> : (
          <table style={theme.table}>
            <thead>
              <tr>
                {columns.map(c => <th key={c} style={theme.th}>{c}</th>)}
                <th style={theme.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!rows?.length && <tr><td colSpan={columns.length + 1}><Empty /></td></tr>}
              {rows?.map(row => (
                <tr key={row.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {columns.map(c => (
                    <td key={c} style={theme.td}>
                      {c === 'Active' ? (
                        <span style={{ color: row.is_active ? theme.success : theme.danger, fontWeight: 600 }}>
                          {row.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      ) : row[c.toLowerCase().replace(/ /g, '_')] ?? row[c] ?? '—'}
                    </td>
                  ))}
                  <td style={theme.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="ghost" size="sm" onClick={() => onEdit(row)}>Edit</Btn>
                      <Btn variant={row.is_active ? 'danger' : 'success'} size="sm" onClick={() => onToggle(row)}>
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Divisions ─────────────────────────────────────────────────────
export function DivisionsPage() {
  const { data, loading, error, reload } = useFetch(api.divisions.list);
  const action = useAction();
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ code: '', name: '' });

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? { code: row.code, name: row.name } : { code: '', name: '' });
    setModal(true);
  };

  const save = async () => {
    await action.run(async () => {
      if (editing) await api.divisions.update(editing.id, { name: form.name });
      else         await api.divisions.create(form);
      setModal(false);
      reload();
    });
  };

  const toggle = async (row) => {
    await action.run(async () => {
      await api.divisions.update(row.id, { is_active: !row.is_active });
      reload();
    });
  };

  // Combine active + inactive for full list
  const allRows = data; // API returns only active; for admin we need all — handled server-side for now

  return (
    <>
      <MasterTable
        title="Divisions"
        columns={['Code', 'Name', 'Active']}
        rows={(data || []).map(r => ({ ...r, Code: r.code, Name: r.name, Active: r.is_active }))}
        loading={loading}
        error={error || action.error}
        onAdd={() => open()}
        onEdit={open}
        onToggle={toggle}
      />
      {modal && (
        <Modal title={editing ? 'Edit Division' : 'New Division'} onClose={() => setModal(false)} width={400}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <FormField label="Code" required>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              disabled={!!editing} placeholder="e.g. RET" />
          </FormField>
          <FormField label="Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. AL-Dhow Retail" autoFocus={!!editing} />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} loading={action.loading}>{editing ? 'Save' : 'Create'}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Departments ───────────────────────────────────────────────────
export function DepartmentsPage() {
  const { data, loading, error, reload } = useFetch(api.departments.list);
  const action = useAction();
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ code: '', name: '' });

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? { code: row.code, name: row.name } : { code: '', name: '' });
    setModal(true);
  };

  const save = async () => {
    await action.run(async () => {
      if (editing) await api.departments.update(editing.id, { name: form.name });
      else         await api.departments.create(form);
      setModal(false);
      reload();
    });
  };

  const toggle = async (row) => {
    await action.run(async () => {
      await api.departments.update(row.id, { is_active: !row.is_active });
      reload();
    });
  };

  return (
    <>
      <MasterTable
        title="Departments"
        columns={['Code', 'Name', 'Active']}
        rows={(data || []).map(r => ({ ...r, Code: r.code, Name: r.name, Active: r.is_active }))}
        loading={loading}
        error={error || action.error}
        onAdd={() => open()}
        onEdit={open}
        onToggle={toggle}
      />
      {modal && (
        <Modal title={editing ? 'Edit Department' : 'New Department'} onClose={() => setModal(false)} width={400}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <FormField label="Code" required>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              disabled={!!editing} placeholder="e.g. ACC" />
          </FormField>
          <FormField label="Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Accounts" autoFocus={!!editing} />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} loading={action.loading}>{editing ? 'Save' : 'Create'}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Projects ──────────────────────────────────────────────────────
export function ProjectsPage() {
  const { data, loading, error, reload } = useFetch(api.projects.list);
  const { data: divisions }              = useFetch(api.divisions.list);
  const { data: departments }            = useFetch(api.departments.list);
  const action = useAction();
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ code: '', name: '', default_division_code: '', default_department_code: '' });

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? {
      code: row.code, name: row.name,
      default_division_code:   row.default_division_code   || '',
      default_department_code: row.default_department_code || '',
    } : { code: '', name: '', default_division_code: '', default_department_code: '' });
    setModal(true);
  };

  const save = async () => {
    await action.run(async () => {
      if (editing) await api.projects.update(editing.id, {
        name: form.name,
        default_division_code:   form.default_division_code   || null,
        default_department_code: form.default_department_code || null,
      });
      else await api.projects.create(form);
      setModal(false);
      reload();
    });
  };

  const toggle = async (row) => {
    await action.run(async () => {
      await api.projects.update(row.id, { is_active: !row.is_active });
      reload();
    });
  };

  return (
    <>
      <MasterTable
        title="Projects / Cost Centers"
        columns={['Code', 'Name', 'Division', 'Department', 'Active']}
        rows={(data || []).map(r => ({
          ...r,
          Code: r.code, Name: r.name,
          Division:   r.default_division_code   || '—',
          Department: r.default_department_code || '—',
          Active: r.is_active,
        }))}
        loading={loading}
        error={error || action.error}
        onAdd={() => open()}
        onEdit={open}
        onToggle={toggle}
      />
      {modal && (
        <Modal title={editing ? 'Edit Project' : 'New Project'} onClose={() => setModal(false)} width={480}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <FormField label="Code" required>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              disabled={!!editing} placeholder="e.g. AL-DHOW-RET" />
          </FormField>
          <FormField label="Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. AL-Dhow Retail Project" />
          </FormField>
          <FormField label="Default Division">
            <SearchableSelect
              options={[{ value: '', label: '— None —' }, ...(divisions || []).map(d => ({ value: d.code, label: `${d.code} — ${d.name}` }))]}
              value={form.default_division_code}
              onChange={v => setForm(f => ({ ...f, default_division_code: v }))}
            />
          </FormField>
          <FormField label="Default Department">
            <SearchableSelect
              options={[{ value: '', label: '— None —' }, ...(departments || []).map(d => ({ value: d.code, label: `${d.code} — ${d.name}` }))]}
              value={form.default_department_code}
              onChange={v => setForm(f => ({ ...f, default_department_code: v }))}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} loading={action.loading}>{editing ? 'Save' : 'Create'}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Expense Types ─────────────────────────────────────────────────
export function ExpenseTypesPage() {
  const { data, loading, error, reload } = useFetch(api.expenseTypes.list);
  const action = useAction();
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', is_employee_linked: false });

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? { name: row.name, is_employee_linked: row.is_employee_linked } : { name: '', is_employee_linked: false });
    setModal(true);
  };

  const save = async () => {
    await action.run(async () => {
      if (editing) await api.expenseTypes.update(editing.id, form);
      else         await api.expenseTypes.create(form);
      setModal(false);
      reload();
    });
  };

  const toggle = async (row) => {
    await action.run(async () => {
      await api.expenseTypes.update(row.id, { is_active: !row.is_active });
      reload();
    });
  };

  return (
    <>
      <MasterTable
        title="Expense Types"
        columns={['Name', 'Employee Linked', 'Active']}
        rows={(data || []).map(r => ({
          ...r,
          Name:              r.name,
          'Employee Linked': r.is_employee_linked ? '✅ Yes' : '—',
          Active:            r.is_active,
        }))}
        loading={loading}
        error={error || action.error}
        onAdd={() => open()}
        onEdit={open}
        onToggle={toggle}
      />
      {modal && (
        <Modal title={editing ? 'Edit Expense Type' : 'New Expense Type'} onClose={() => setModal(false)} width={400}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <FormField label="Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Work Permits" autoFocus />
          </FormField>
          <FormField label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox"
                checked={form.is_employee_linked}
                onChange={e => setForm(f => ({ ...f, is_employee_linked: e.target.checked }))}
              />
              Requires employee code (9-month cycle rule applies)
            </label>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} loading={action.loading}>{editing ? 'Save' : 'Create'}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Employees ─────────────────────────────────────────────────────
export function EmployeesPage() {
  const { data, loading, error, reload } = useFetch(api.employees.list);
  const { data: divisions }              = useFetch(api.divisions.list);
  const action = useAction();
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ code: '', name: '', division: '', division_code: '', designation: '' });
  const [search,  setSearch]  = useState('');

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? {
      code: row.code, name: row.name,
      division: row.division || '', division_code: row.division_code || '',
      designation: row.designation || '',
    } : { code: '', name: '', division: '', division_code: '', designation: '' });
    setModal(true);
  };

  const save = async () => {
    await action.run(async () => {
      if (editing) await api.employees.update(editing.code, {
        name: form.name, division: form.division,
        division_code: form.division_code, designation: form.designation,
      });
      else await api.employees.create(form);
      setModal(false);
      reload();
    });
  };

  const handleDelete = async (row) => {
    if (!confirm(`Deactivate employee ${row.name}?`)) return;
    await action.run(async () => { await api.employees.delete(row.code); reload(); });
  };

  const filtered = (data || []).filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.code.includes(search)
  );

  return (
    <div className="pcs-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: theme.primary }}>Employees</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...theme.input, maxWidth: 220 }} />
          <Btn size="sm" onClick={() => open()}>+ Add New</Btn>
        </div>
      </div>
      {(error || action.error) && <Alert type="error">{error || action.error}</Alert>}

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        {loading ? <PageLoader /> : (
          <table style={theme.table}>
            <thead>
              <tr>
                {['Code','Name','Division','Designation','Actions'].map(h => (
                  <th key={h} style={theme.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!filtered.length && <tr><td colSpan={5}><Empty /></td></tr>}
              {filtered.map(e => (
                <tr key={e.id}
                  onMouseEnter={r => r.currentTarget.style.background = '#f8f9fb'}
                  onMouseLeave={r => r.currentTarget.style.background = ''}
                >
                  <td style={{ ...theme.td }}><code style={{ fontSize: 13 }}>{e.code}</code></td>
                  <td style={{ ...theme.td, fontWeight: 500 }}>{e.name}</td>
                  <td style={theme.td}>{e.division || '—'}</td>
                  <td style={theme.td}>{e.designation || '—'}</td>
                  <td style={theme.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="ghost" size="sm" onClick={() => open(e)}>Edit</Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleDelete(e)}>Remove</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={editing ? `Edit — ${editing.name}` : 'New Employee'} onClose={() => setModal(false)} width={480}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Employee Code" required>
              <Input value={form.code} disabled={!!editing}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="e.g. EMP001" />
            </FormField>
            <FormField label="Full Name" required>
              <Input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name" autoFocus={!!editing} />
            </FormField>
            <FormField label="Division">
              <SearchableSelect
                options={[{ value: '', label: '— None —' }, ...(divisions || []).map(d => ({ value: d.code, label: `${d.code} — ${d.name}` }))]}
                value={form.division_code}
                onChange={v => {
                  const d = (divisions || []).find(d => d.code === v);
                  setForm(f => ({ ...f, division_code: v, division: d?.name || '' }));
                }}
              />
            </FormField>
            <FormField label="Designation">
              <Input value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                placeholder="Job title" />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} loading={action.loading}>{editing ? 'Save' : 'Create'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
