/**
 * @file: Login.tsx
 * @description: Login form (email, password).
 * @dependencies: useAuth, themes, validation
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LogoIcon } from './LogoIcon';
import { validateLogin } from '../utils/validation';
import { CanvasParticlesBackground } from './CanvasParticlesBackground';
import './Login.css';

export interface LoginProps {
  onSwitchToRegister?: () => void;
}

export function Login({ onSwitchToRegister }: LoginProps) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginValidation = useMemo(() => validateLogin(email), [email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    if (!loginValidation.valid) {
      setError(loginValidation.error || 'Некорректный email');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    }
  };

  return (
    <div className="login-page">
      <CanvasParticlesBackground />
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <LogoIcon width="100%" height="auto" className="login-logo-img" showText={true} />
          </div>
          <p className="login-subtitle">Войдите в систему</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <label className="login-label">
            Email
            <input
              type="email"
              className={`login-input ${email ? (loginValidation.valid ? 'login-input-valid' : 'login-input-invalid') : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>
          <label className="login-label">
            Пароль
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </label>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="login-hint">
          {onSwitchToRegister ? (
            <>
              Нет аккаунта?{' '}
              <button
                type="button"
                className="login-link"
                onClick={onSwitchToRegister}
                disabled={loading}
              >
                Зарегистрироваться
              </button>
            </>
          ) : (
            'По умолчанию: admin@imlight.local / admin123'
          )}
        </p>
      </div>
    </div>
  );
}
