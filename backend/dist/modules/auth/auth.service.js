"use strict";
/**
 * @file: auth.service.ts
 * @description: Auth service (login, JWT, me).
 * @dependencies: users, permissions, jsonwebtoken, bcryptjs
 * @created: 2026-01-27
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcryptjs"));
const validation_1 = require("./validation");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES ? Number(process.env.JWT_EXPIRES) || 86400 : 86400;
const DEFAULT_REGISTER_PERMISSIONS = [
    'events:read',
    'staff:read',
    'dashboard:read',
    'calendar:read',
];
class AuthService {
    constructor(users, permissions) {
        this.users = users;
        this.permissions = permissions;
    }
    async login(email, password) {
        const trimmedEmail = String(email).trim().toLowerCase();
        // Валидация логина
        const loginValidation = (0, validation_1.validateLogin)(trimmedEmail);
        if (!loginValidation.valid) {
            return null; // Не сообщаем детали валидации для безопасности
        }
        const user = await this.users.getByEmail(trimmedEmail);
        if (!user)
            return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return null;
        const perms = this.permissions.getByUserId(user.id);
        const opts = { expiresIn: JWT_EXPIRES };
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, opts);
        return {
            accessToken: token,
            user: this.toDto(user),
            permissions: perms,
        };
    }
    async register(email, password, displayName) {
        const trimmedEmail = String(email).trim().toLowerCase();
        const trimmedDisplay = String(displayName).trim();
        // Валидация логина
        const loginValidation = (0, validation_1.validateLogin)(trimmedEmail);
        if (!loginValidation.valid) {
            return { error: loginValidation.error || 'Некорректный логин' };
        }
        // Валидация пароля
        const passwordValidation = (0, validation_1.validatePassword)(password);
        if (!passwordValidation.valid) {
            return { error: passwordValidation.error || 'Некорректный пароль' };
        }
        // Валидация отображаемого имени
        if (!trimmedDisplay || trimmedDisplay.length < 2) {
            return { error: 'Отображаемое имя должно быть не менее 2 символов' };
        }
        if (trimmedDisplay.length > 100) {
            return { error: 'Отображаемое имя должно быть не более 100 символов' };
        }
        // Проверка на существующего пользователя
        const existingUser = await this.users.getByEmail(trimmedEmail);
        if (existingUser) {
            return { error: 'Пользователь с таким логином уже зарегистрирован' };
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await this.users.add({
            email: trimmedEmail,
            passwordHash: hash,
            displayName: trimmedDisplay,
        });
        this.permissions.setForUser(user.id, [...DEFAULT_REGISTER_PERMISSIONS]);
        const perms = this.permissions.getByUserId(user.id);
        const opts = { expiresIn: JWT_EXPIRES };
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, opts);
        return {
            accessToken: token,
            user: this.toDto(user),
            permissions: perms,
        };
    }
    verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return payload;
        }
        catch {
            return null;
        }
    }
    async getUserById(id) {
        const u = await this.users.getById(id);
        return u ? this.toDto(u) : null;
    }
    getPermissions(userId) {
        return this.permissions.getByUserId(userId);
    }
    hasPermission(userId, permission) {
        return this.permissions.has(userId, permission);
    }
    async updateProfile(userId, updates) {
        const user = await this.users.getById(userId);
        if (!user) {
            return { error: 'Пользователь не найден' };
        }
        const updated = await this.users.updateProfile(userId, updates);
        if (!updated) {
            return { error: 'Не удалось обновить профиль' };
        }
        return this.toDto(updated);
    }
    async updatePassword(userId, data) {
        const user = await this.users.getById(userId);
        if (!user) {
            return { error: 'Пользователь не найден' };
        }
        const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!ok) {
            return { error: 'Неверный текущий пароль' };
        }
        // Валидация нового пароля
        const passwordValidation = (0, validation_1.validatePassword)(data.newPassword);
        if (!passwordValidation.valid) {
            return { error: passwordValidation.error || 'Некорректный пароль' };
        }
        const hash = await bcrypt.hash(data.newPassword, 10);
        await this.users.updatePassword(userId, hash);
        return { success: true };
    }
    toDto(u) {
        return {
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            firstName: u.firstName,
            lastName: u.lastName,
            avatarUrl: u.avatarUrl,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        };
    }
}
exports.AuthService = AuthService;
