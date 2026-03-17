import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Btn, Alert, FormField, Input } from '../components/UI.jsx';
import api from '../api.js';
import { theme } from '../theme.js';

export default function LoginPage() {
  const { login, refreshUser } = useAuth();
  const [form,      setForm]      = useState({ username: '', password: '' });
  const [newPw,     setNewPw]     = useState({ new_password: '', confirm: '' });
  const [needsPwChange, setNeedsPwChange] = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.username, form.password);
      if (u.must_change_pw) setNeedsPwChange(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (newPw.new_password !== newPw.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (newPw.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.auth.changePassword({ new_password: newPw.new_password });
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: '#fff', borderRadius: 12, padding: 36,
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: 400,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.primary} 0%, #2d5a9e 100%)`,
    }}>
      <div style={card} className="pcs-fade">
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: theme.primary, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 26 }}>💰</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.primary }}>PettyCash</h1>
          <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>AL-Dhow Group</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {!needsPwChange ? (
          <form onSubmit={handleLogin}>
            <FormField label="Username" required>
              <Input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                autoFocus
                required
              />
            </FormField>
            <FormField label="Password" required>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </FormField>
            <Btn type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} loading={loading}>
              Sign In
            </Btn>
          </form>
        ) : (
          <form onSubmit={handleChangePassword}>
            <Alert type="warning">
              You must set a new password before continuing.
            </Alert>
            <FormField label="New Password" required>
              <Input
                type="password"
                value={newPw.new_password}
                onChange={e => setNewPw(p => ({ ...p, new_password: e.target.value }))}
                placeholder="At least 6 characters"
                autoFocus
                required
              />
            </FormField>
            <FormField label="Confirm Password" required>
              <Input
                type="password"
                value={newPw.confirm}
                onChange={e => setNewPw(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
                required
              />
            </FormField>
            <Btn type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} loading={loading}>
              Set Password & Continue
            </Btn>
          </form>
        )}
      </div>
    </div>
  );
}
