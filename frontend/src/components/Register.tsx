/**
 * @file: Register.tsx
 * @description: Registration form (email, password, displayName).
 * @dependencies: useAuth, themes, validation
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LogoIcon } from './LogoIcon';
import { FieldHint } from './FieldHint';
import { validateLogin, validatePassword } from '../utils/validation';
import { CanvasParticlesBackground } from './CanvasParticlesBackground';
import './Login.css';

export interface RegisterProps {
  onSwitchToLogin?: () => void;
}

const EMAIL_HINT = `Введите адрес электронной почты:
• Например: user@example.com
• Должен содержать символ @ и домен`;

const PASSWORD_HINT = `Требования к паролю:
• От 6 до 30 символов
• Рекомендуется использовать буквы в разных регистрах и цифры`;

export function Register({ onSwitchToLogin }: RegisterProps) {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginValidation = useMemo(() => validateLogin(email), [email]);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const confirmPasswordValid = useMemo(() => {
    if (!confirmPassword) return { valid: false };
    return { valid: password === confirmPassword };
  }, [password, confirmPassword]);
  const displayNameValid = useMemo(() => {
    const trimmed = displayName.trim();
    return { valid: trimmed.length >= 2 && trimmed.length <= 100 };
  }, [displayName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    
    if (!loginValidation.valid) {
      setError(loginValidation.error || 'Некорректный email');
      return;
    }
    
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Некорректный пароль');
      return;
    }
    
    if (!confirmPasswordValid.valid) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (!displayNameValid.valid) {
      setError('Отображаемое имя должно быть от 2 до 100 символов');
      return;
    }
    
    try {
      await register(trimmedEmail, password, trimmedName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
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
          <p className="login-subtitle">Регистрация</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <label className="login-label">
            <div className="login-label-header">
              <span>Email</span>
              <FieldHint text={EMAIL_HINT} />
            </div>
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
            <div className="login-label-header">
              <span>Отображаемое имя</span>
            </div>
            <input
              type="text"
              className={`login-input ${displayName ? (displayNameValid.valid ? 'login-input-valid' : 'login-input-invalid') : ''}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Иван Иванов"
              autoComplete="name"
              disabled={loading}
            />
          </label>
          <label className="login-label">
            <div className="login-label-header">
              <span>Пароль</span>
              <FieldHint text={PASSWORD_HINT} />
            </div>
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`login-input ${password ? (passwordValidation.valid ? 'login-input-valid' : 'login-input-invalid') : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
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
          <label className="login-label">
            <div className="login-label-header">
              <span>Подтвердите пароль</span>
            </div>
            <div className="login-password-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`login-input ${confirmPassword ? (confirmPasswordValid.valid ? 'login-input-valid' : 'login-input-invalid') : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={loading}
                title={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </label>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        {onSwitchToLogin && (
          <p className="login-hint">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              className="login-link"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Войти
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
