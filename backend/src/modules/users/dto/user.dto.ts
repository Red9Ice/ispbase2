/**
 * @file: user.dto.ts
 * @description: DTOs for users (auth).
 * @dependencies: none
 * @created: 2026-01-27
 */

export interface UserDto {
  id: number;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDto {
  email: string;
  password: string;
  displayName: string;
}

export interface UserRecord extends UserDto {
  passwordHash: string;
}

export interface UserUpdateProfileDto {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UserUpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}
