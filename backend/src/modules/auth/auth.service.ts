/**
 * @file: auth.service.ts
 * @description: Auth service (login, JWT, me).
 * @dependencies: users, permissions, jsonwebtoken, bcryptjs
 * @created: 2026-01-27
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { UserDto, UserUpdateProfileDto, UserUpdatePasswordDto } from '../users/dto/user.dto';
import { PermissionKey } from '../permissions/dto/permission.dto';
import { validateLogin, validatePassword } from './validation';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES ? Number(process.env.JWT_EXPIRES) || 86400 : 86400;

const DEFAULT_REGISTER_PERMISSIONS: PermissionKey[] = [
  'events:read',
  'staff:read',
  'dashboard:read',
  'calendar:read',
];

export interface LoginResult {
  accessToken: string;
  user: UserDto;
  permissions: PermissionKey[];
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly permissions: PermissionsRepository,
  ) {}

  async login(email: string, password: string): Promise<LoginResult | null> {
    const trimmedEmail = String(email).trim().toLowerCase();
    
    // Валидация логина
    const loginValidation = validateLogin(trimmedEmail);
    if (!loginValidation.valid) {
      return null; // Не сообщаем детали валидации для безопасности
    }
    
    const user = await this.users.getByEmail(trimmedEmail);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    const perms = this.permissions.getByUserId(user.id);
    const opts: SignOptions = { expiresIn: JWT_EXPIRES };
    const token = jwt.sign(
      { userId: user.id, email: user.email } as JWTPayload,
      JWT_SECRET,
      opts,
    );
    return {
      accessToken: token,
      user: this.toDto(user),
      permissions: perms,
    };
  }

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<LoginResult | { error: string }> {
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedDisplay = String(displayName).trim();
    
    // Валидация логина
    const loginValidation = validateLogin(trimmedEmail);
    if (!loginValidation.valid) {
      return { error: loginValidation.error || 'Некорректный логин' };
    }
    
    // Валидация пароля
    const passwordValidation = validatePassword(password);
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
    const opts: SignOptions = { expiresIn: JWT_EXPIRES };
    const token = jwt.sign(
      { userId: user.id, email: user.email } as JWTPayload,
      JWT_SECRET,
      opts,
    );
    return {
      accessToken: token,
      user: this.toDto(user),
      permissions: perms,
    };
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return payload;
    } catch {
      return null;
    }
  }

  async getUserById(id: number): Promise<UserDto | null> {
    const u = await this.users.getById(id);
    return u ? this.toDto(u) : null;
  }

  getPermissions(userId: number): PermissionKey[] {
    return this.permissions.getByUserId(userId);
  }

  hasPermission(userId: number, permission: PermissionKey): boolean {
    return this.permissions.has(userId, permission);
  }

  async updateProfile(userId: number, updates: UserUpdateProfileDto): Promise<UserDto | { error: string }> {
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

  async updatePassword(userId: number, data: UserUpdatePasswordDto): Promise<{ success: boolean } | { error: string }> {
    const user = await this.users.getById(userId);
    if (!user) {
      return { error: 'Пользователь не найден' };
    }
    const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!ok) {
      return { error: 'Неверный текущий пароль' };
    }
    
    // Валидация нового пароля
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.valid) {
      return { error: passwordValidation.error || 'Некорректный пароль' };
    }
    
    const hash = await bcrypt.hash(data.newPassword, 10);
    await this.users.updatePassword(userId, hash);
    return { success: true };
  }

  private toDto(u: { id: number; email: string; displayName: string; firstName?: string; lastName?: string; avatarUrl?: string; createdAt: string; updatedAt: string }): UserDto {
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
