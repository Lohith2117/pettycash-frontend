import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('pcs_token');
    if (!token) { setLoading(false); return; }

    api.auth.me()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('pcs_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user: u } = await api.auth.login({ username, password });
    localStorage.setItem('pcs_token', token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pcs_token');
    setUser(null);
  }, []);

  // After password change, refresh user to clear must_change_pw
  const refreshUser = useCallback(async () => {
    const u = await api.auth.me();
    setUser(u);
  }, []);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (user.is_admin) return true;
    return user.system_functions?.includes(role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
