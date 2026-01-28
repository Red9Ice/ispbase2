"use strict";
/**
 * @file: middleware.ts
 * @description: JWT auth and permission-check middleware.
 * @dependencies: auth.service, express
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requirePermission = requirePermission;
function authMiddleware(authService, opts) {
    const skipList = opts?.skipPaths ?? [];
    return (req, res, next) => {
        const p = req.path || '';
        const url = req.originalUrl || req.url || '';
        const skip = skipList.includes(p) || skipList.some((s) => url.endsWith(s));
        if (req.method === 'POST' && skip)
            return next();
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
function requirePermission(authService, permission) {
    return (req, res, next) => {
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
