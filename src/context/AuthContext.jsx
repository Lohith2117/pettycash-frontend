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
    try {
      // ── FIXED: We no longer destructure directly on the call ──
      const data = await api.auth.login({ username, password });
      
      // If the request was successful, data will contain the token and user
      if (data && data.token) {
        localStorage.setItem('pcs_token', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      // ── FIXED: This prevents the 'Cannot destructure' crash ──
      // It passes the real error message (like "Invalid credentials") to your LoginPage
      throw new Error(err.message || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pcs_token');
    setUser(null);
  }, []);

  // After password change, refresh user to clear must_change_pw
  const refreshUser = useCallback(async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
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
