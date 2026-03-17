import { useState } from 'react';
import api from '../api.js';
import { useFetch, useAction } from '../hooks/useFetch.js';
import { Btn, Alert, Modal, FormField, Input, Select, PageLoader, Empty } from '../components/UI.jsx';
import { theme } from '../theme.js';

const ROLES = [
  { value: 'petty_cash_holder',  label: 'Petty Cash Holder' },
  { value: 'employee_definition',label: 'Employee Definition' },
  { value: 'chief_accountant',   label: 'Chief Accountant' },
  { value: 'cashier',            label: 'Cashier' },
];

const EMPTY_FORM = {
  username: '', full_name: '', password: '', is_admin: false, is_active: true,
  system_functions: [], employee_code: '', manager_id: '', fund_limit: 0,
  default_project_code: '',
};

export default function AdminPage() {
  const { data: users,    loading, error, reload } = useFetch(api.admin.getUsers);
  const { data: projects }                          = useFetch(api.projects.list);
  const action                                      = useAction();

  const [modal,   setModal]   = useState(null); // null | 'create' | 'edit' | 'reset'
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [resetPw, setResetPw] = useState('');
  const [msg,     setMsg]     = useState('');

  const activeUsers = users?.filter(u => u.is_active) || [];

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal('create');
    setMsg('');
  }

  function openEdit(u) {
    setEditing(u);
    setForm({
      username: u.username, full_name: u.full_name, password: '',
      is_admin: u.is_admin, is_active: u.is_active,
      system_functions: u.system_functions || [],
      employee_code: u.employee_code || '',
      manager_id: u.manager_id || '',
      fund_limit: u.fund_limit || 0,
      default_project_code: u.default_project_code || '',
    });
    setModal('edit');
    setMsg('');
  }

  function openReset(u) {
    setEditing(u);
    setResetPw('');
    setModal('reset');
    setMsg('');
  }

  const toggleRole = role => {
    setForm(f => ({
      ...f,
      system_functions: f.system_functions.includes(role)
        ? f.system_functions.filter(r => r !== role)
        : [...f.system_functions, role],
    }));
  };

  const handleSave = async () => {
    await action.run(async () => {
      if (modal === 'create') {
        await api.admin.createUser(form);
      } else {
        const { password, username, ...rest } = form;
        await api.admin.updateUser(editing.id, rest);
      }
      setMsg(modal === 'create' ? 'User created!' : 'User updated!');
      reload();
      setTimeout(() => setModal(null), 800);
    });
  };

  const handleReset = async () => {
    await action.run(async () => {
      await api.admin.resetPassword(editing.id, { new_password: resetPw });
      setMsg('Password reset — user must change on next login.');
      setTimeout(() => setModal(null), 1200);
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="pcs-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.primary }}>User Administration</h2>
        <Btn onClick={openCreate}>+ New User</Btn>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={theme.table}>
          <thead>
            <tr>
              {['Username','Full Name','Roles','Admin','Active','Manager','Actions'].map(h => (
                <th key={h} style={theme.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!users?.length && (
              <tr><td colSpan={7}><Empty /></td></tr>
            )}
            {users?.map(u => (
              <tr key={u.id}>
                <td style={theme.td}><code style={{ fontSize: 13 }}>{u.username}</code></td>
                <td style={theme.td}>{u.full_name}</td>
                <td style={theme.td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(u.system_functions || []).map(r => (
                      <span key={r} style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 99,
                        background: theme.infoBg, color: theme.info, fontWeight: 600,
                      }}>{r}</span>
                    ))}
                  </div>
                </td>
                <td style={theme.td}>{u.is_admin ? '✅' : '—'}</td>
                <td style={theme.td}>
                  <span style={{ color: u.is_active ? theme.success : theme.danger, fontWeight: 600 }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={theme.td}>{u.manager_name || '—'}</td>
                <td style={theme.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Btn>
                    <Btn variant="danger" size="sm" onClick={() => openReset(u)}>Reset PW</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Create User' : `Edit — ${editing?.username}`}
          onClose={() => setModal(null)}
          width={560}
        >
          {action.error && <Alert type="error">{action.error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Username" required>
              <Input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                disabled={modal === 'edit'}
              />
            </FormField>
            <FormField label="Full Name" required>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </FormField>
            {modal === 'create' && (
              <FormField label="Password" required>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </FormField>
            )}
            <FormField label="Employee Code">
              <Input value={form.employee_code} onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))} />
            </FormField>
            <FormField label="Fund Limit (KWD)">
              <Input type="number" step="0.001" value={form.fund_limit} onChange={e => setForm(f => ({ ...f, fund_limit: e.target.value }))} />
            </FormField>
            <FormField label="Default Project">
              <Select value={form.default_project_code} onChange={e => setForm(f => ({ ...f, default_project_code: e.target.value }))}>
                <option value="">— None —</option>
                {(projects || []).map(p => (
                  <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Manager">
              <Select value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
                <option value="">— No Manager —</option>
                {activeUsers.filter(u => u.id !== editing?.id).map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'active' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>

          <FormField label="System Roles">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              {ROLES.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox"
                    checked={form.system_functions.includes(r.value)}
                    onChange={() => toggleRole(r.value)}
                  />
                  {r.label}
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox"
                  checked={form.is_admin}
                  onChange={() => setForm(f => ({ ...f, is_admin: !f.is_admin }))}
                />
                <strong>Admin</strong>
              </label>
            </div>
          </FormField>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleSave} loading={action.loading}>
              {modal === 'create' ? 'Create User' : 'Save Changes'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {modal === 'reset' && (
        <Modal title={`Reset Password — ${editing?.username}`} onClose={() => setModal(null)} width={400}>
          {action.error && <Alert type="error">{action.error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}
          <FormField label="New Password" required>
            <Input
              type="password"
              value={resetPw}
              onChange={e => setResetPw(e.target.value)}
              placeholder="At least 6 characters"
              autoFocus
            />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleReset} loading={action.loading}>Reset Password</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
