/**
 * @file: cookies.ts
 * @description: Utility functions for working with cookies.
 * @dependencies: none
 * @created: 2026-01-27
 */

const COOKIE_NAME = 'isp_auth_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 дней в секундах

/**
 * Устанавливает куку с токеном авторизации
 */
export function setAuthCookie(token: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000);
  
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  
  document.cookie = `${COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secureFlag}`;
}

/**
 * Получает токен авторизации из куки
 */
export function getAuthCookie(): string | null {
  const name = `${COOKIE_NAME}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  
  return null;
}

/**
 * Удаляет куку с токеном авторизации
 */
export function removeAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
