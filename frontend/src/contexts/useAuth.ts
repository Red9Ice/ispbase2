/**
 * @file: useAuth.ts
 * @description: Hook for accessing auth context.
 * @dependencies: AuthContext
 * @created: 2026-01-27
 */

import { useContext } from 'react';
import { AuthContext } from './authContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
