"use strict";
/**
 * @file: users.repository.ts
 * @description: PostgreSQL repository for users.
 * @dependencies: user.dto, common/database
 * @created: 2026-01-27
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const database_1 = require("../../common/database");
class UsersRepository {
    async add(record) {
        const now = new Date().toISOString();
        const result = await database_1.pool.query(`INSERT INTO "user" (email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at`, [
            record.email,
            record.passwordHash,
            record.displayName,
            record.firstName || null,
            record.lastName || null,
            record.avatarUrl || null,
            now,
            now,
        ]);
        const row = result.rows[0];
        return this.rowToRecord(row);
    }
    async getById(id) {
        const result = await database_1.pool.query('SELECT id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at FROM "user" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return undefined;
        }
        return this.rowToRecord(result.rows[0]);
    }
    async getByEmail(email) {
        const result = await database_1.pool.query('SELECT id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at FROM "user" WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) {
            return undefined;
        }
        return this.rowToRecord(result.rows[0]);
    }
    async list() {
        const result = await database_1.pool.query('SELECT id, email, password_hash, display_name, first_name, last_name, avatar_url, created_at, updated_at FROM "user" ORDER BY id');
        return result.rows.map((row) => this.rowToRecord(row));
    }
    async updatePassword(id, passwordHash) {
        const now = new Date().toISOString();
        await database_1.pool.query('UPDATE "user" SET password_hash = $1, updated_at = $2 WHERE id = $3', [passwordHash, now, id]);
    }
    async updateProfile(id, updates) {
        const user = await this.getById(id);
        if (!user) {
            return undefined;
        }
        const updateFields = [];
        const values = [];
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
        await database_1.pool.query(`UPDATE "user" SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, values);
        const updated = await this.getById(id);
        return updated;
    }
    rowToRecord(row) {
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
exports.UsersRepository = UsersRepository;
