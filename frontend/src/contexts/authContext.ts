/**
 * @file: authContext.ts
 * @description: Auth context instance and types.
 * @dependencies: none
 * @created: 2026-01-27
 */

import { createContext } from 'react';
import type { AuthUser, PermissionKey } from '../services/api';

export interface AuthContextValue {
  user: AuthUser | null;
  permissions: PermissionKey[];
  loading: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  hasPermission: (p: PermissionKey) => boolean;
  updateUser: (user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
