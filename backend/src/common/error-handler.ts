/**
 * @file: error-handler.ts
 * @description: Unified error handling utilities.
 * @dependencies: express
 * @created: 2026-01-28
 */

import { Response } from 'express';

export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Обрабатывает ошибку и отправляет соответствующий HTTP ответ
 */
export function handleError(error: unknown, res: Response, defaultMessage = 'Internal server error'): void {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (error instanceof Error) {
    // Ошибки валидации и бизнес-логики возвращаем как 400
    if (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('required')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Остальные ошибки - 500
    console.error('Error:', error.message, error.stack);
    const response: ApiError = { error: defaultMessage };
    if (isDevelopment) {
      response.details = error.message;
    }
    res.status(500).json(response);
  } else {
    console.error('Unknown error:', error);
    res.status(500).json({ error: defaultMessage });
  }
}

/**
 * Обрабатывает ошибку валидации (400)
 */
export function handleValidationError(error: unknown, res: Response): void {
  const message = error instanceof Error ? error.message : 'Bad request';
  res.status(400).json({ error: message });
}

/**
 * Обрабатывает ошибку "не найдено" (404)
 */
export function handleNotFoundError(res: Response, entity = 'Resource'): void {
  res.status(404).json({ error: `${entity} not found` });
}
