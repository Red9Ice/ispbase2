/**
 * @file: middleware.ts
 * @description: JWT auth and permission-check middleware.
 * @dependencies: auth.service, express
 * @created: 2026-01-27
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from './auth.service';
import { PermissionKey } from '../permissions/dto/permission.dto';

export interface AuthRequest extends Request {
  auth?: JWTPayload;
}

export function authMiddleware(authService: AuthService, opts?: { skipPaths?: string[] }) {
  const skipList = opts?.skipPaths ?? [];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const p = req.path || '';
    const url = req.originalUrl || req.url || '';
    const skip = skipList.includes(p) || skipList.some((s) => url.endsWith(s));
    
    // Пропускаем все методы HTTP для путей в skipList
    // Для GET запросов к /settings и /events также пропускаем (публичный доступ)
    if (skip || (req.method === 'GET' && (p === '/settings' || p === '/events'))) {
      return next();
    }
    
    // Пытаемся получить токен из заголовка Authorization
    const raw = req.headers.authorization;
    let token = raw?.startsWith('Bearer ') ? raw.slice(7) : null;
    
    // Если токена нет в заголовке, пытаемся получить из куки
    if (!token && req.cookies) {
      token = req.cookies.isp_auth_token || null;
    }
    
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    req.auth = payload;
    next();
  };
}

export function requirePermission(authService: AuthService, permission: PermissionKey) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!authService.hasPermission(req.auth.userId, permission)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
