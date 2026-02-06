import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem('token');
      setUser(null);
      // Don't force navigate here. RequireAuth will handle protected routes.
      // This prevents redirecting users from public pages (like Landing) if their stale token fails.
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (!cancelled) setUser(res.data);
      } catch {
        localStorage.removeItem('token');
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (token, redirectTo = '/dashboard') => {
    localStorage.setItem('token', token);
    const res = await api.get('/auth/me');
    setUser(res.data);
    navigate(redirectTo, { replace: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const refreshUser = async () => {
      try {
          const res = await api.get('/auth/me');
          setUser(res.data);
      } catch (err) {
          console.error("Failed to refresh user", err);
      }
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isLoading,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
