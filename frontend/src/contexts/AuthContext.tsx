/**
 * @file: AuthContext.tsx
 * @description: Auth provider (user, token, permissions, login, logout).
 * @dependencies: api, authContext, setAuthToken
 * @created: 2026-01-27
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthToken } from '../services/api';
import type { AuthUser, PermissionKey } from '../services/api';
import { AuthContext } from './authContext';
import { getAuthCookie, setAuthCookie, removeAuthCookie } from '../utils/cookies';

interface AuthState {
  user: AuthUser | null;
  permissions: PermissionKey[];
  loading: boolean;
  ready: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    permissions: [],
    loading: false,
    ready: false,
  });

  const logout = useCallback(() => {
    setAuthToken(null);
    removeAuthCookie();
    setState({ user: null, permissions: [], loading: false, ready: true });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await api.auth.login(email, password);
      setAuthToken(res.accessToken);
      setAuthCookie(res.accessToken);
      setState({
        user: res.user,
        permissions: res.permissions,
        loading: false,
        ready: true,
      });
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await api.auth.register(email, password, displayName);
        setAuthToken(res.accessToken);
        setAuthCookie(res.accessToken);
        setState({
          user: res.user,
          permissions: res.permissions,
          loading: false,
          ready: true,
        });
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [],
  );

  const hasPermission = useCallback(
    (p: PermissionKey) => state.permissions.includes(p),
    [state.permissions],
  );

  const updateUser = useCallback((user: AuthUser) => {
    setState((s) => ({ ...s, user }));
  }, []);

  useEffect(() => {
    const token = getAuthCookie();
    if (!token) {
      setState((s) => ({ ...s, ready: true }));
      return;
    }
    setAuthToken(token);
    api.auth
      .me()
      .then((res) => {
        setState({
          user: res.user,
          permissions: res.permissions,
          loading: false,
          ready: true,
        });
      })
      .catch(() => {
        setAuthToken(null);
        removeAuthCookie();
        setState({ user: null, permissions: [], loading: false, ready: true });
      });
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      hasPermission,
      updateUser,
    }),
    [state, login, register, logout, hasPermission, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
