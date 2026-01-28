/**
 * @file: validation.ts
 * @description: Validation utilities for login and password.
 * @dependencies: none
 * @created: 2026-01-27
 */

/**
 * Валидация email
 * Требования:
 * - Длина от 2 до 30 символов
 * - Буквы латинского алфавита, цифры, символы @, _, -, .
 * - Регистр не имеет значения
 */
export function validateLogin(login: string): { valid: boolean; error?: string } {
  const trimmed = login.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Email обязателен' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Email должен быть не менее 2 символов' };
  }
  
  if (trimmed.length > 30) {
    return { valid: false, error: 'Email должен быть не более 30 символов' };
  }
  
  // Простая проверка формата email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Введите корректный адрес электронной почты' };
  }
  
  return { valid: true };
}

/**
 * Валидация пароля
 * Требования:
 * - Длина от 6 до 30 символов
 * - Рекомендуется использовать буквы латинского алфавита в разных регистрах и цифры
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Пароль обязателен' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен быть не менее 6 символов' };
  }
  
  if (password.length > 30) {
    return { valid: false, error: 'Пароль должен быть не более 30 символов' };
  }
  
  return { valid: true };
}
