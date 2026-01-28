/**
 * @file: users.repository.ts
 * @description: PostgreSQL repository for users.
 * @dependencies: user.dto, common/database
 * @created: 2026-01-27
 */

import { UserRecord, UserUpdateProfileDto } from './dto/user.dto';
import { pool } from '../../common/database';

export class UsersRepository {
  async add(record: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRecord> {
    const now = new Date().toISOString();
    const result = await pool.query(
      `INSERT INTO "user" (email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at`,
      [
        record.email,
        record.passwordHash,
        record.displayName,
        record.firstName || null,
        record.lastName || null,
        record.avatarUrl || null,
        now,
        now,
      ]
    );
    const row = result.rows[0];
    return this.rowToRecord(row);
  }

  async getById(id: number): Promise<UserRecord | undefined> {
    const result = await pool.query(
      'SELECT id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at FROM "user" WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return undefined;
    }
    return this.rowToRecord(result.rows[0]);
  }

  async getByEmail(email: string): Promise<UserRecord | undefined> {
    const result = await pool.query(
      'SELECT id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at FROM "user" WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (result.rows.length === 0) {
      return undefined;
    }
    return this.rowToRecord(result.rows[0]);
  }

  async list(): Promise<UserRecord[]> {
    const result = await pool.query(
      'SELECT id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at FROM "user" ORDER BY id'
    );
    return result.rows.map((row) => this.rowToRecord(row));
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    const now = new Date().toISOString();
    await pool.query(
      'UPDATE "user" SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [passwordHash, now, id]
    );
  }

  async updateProfile(id: number, updates: UserUpdateProfileDto): Promise<UserRecord | undefined> {
    const user = await this.getById(id);
    if (!user) {
      return undefined;
    }

    const updateFields: string[] = [];
    const values: (string | null | number)[] = [];
    let paramIndex = 1;

    if (updates.firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(updates.firstName || null);
    }
    if (updates.lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(updates.lastName || null);
    }
    if (updates.avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      values.push(updates.avatarUrl || null);
    }

    if (updateFields.length === 0) {
      return user;
    }

    const now = new Date().toISOString();
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    await pool.query(
      `UPDATE "user" SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    const updated = await this.getById(id);
    return updated;
  }

  private rowToRecord(row: {
    id: string | number;
    email: string;
    password_hash: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  }): UserRecord {
    return {
      id: typeof row.id === 'number' ? row.id : parseInt(String(row.id), 10),
      email: row.email,
      passwordHash: row.password_hash,
      displayName: row.display_name || '',
      firstName: row.first_name || undefined,
      lastName: row.last_name || undefined,
      avatarUrl: row.avatar_url || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
