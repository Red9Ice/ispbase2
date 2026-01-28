/**
 * @file: history.repository.ts
 * @description: PostgreSQL repository for entity change history. Persistent storage, 1-year TTL.
 * @dependencies: history.dto, common/database
 * @created: 2026-01-27
 */

import { pool } from '../../common/database';
import type { ChangeHistoryRecord, HistoryFilters, RecordHistoryInput } from './dto/history.dto';

function rowToRecord(row: {
  id: string;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: unknown;
  new_values: unknown;
  created_at: string;
}): ChangeHistoryRecord {
  return {
    id: parseInt(row.id, 10),
    actorId: row.actor_id != null ? parseInt(String(row.actor_id), 10) : null,
    action: row.action as 'create' | 'update' | 'delete',
    entityType: row.entity_type,
    entityId: parseInt(row.entity_id, 10),
    oldValues: (row.old_values as Record<string, unknown>) ?? null,
    newValues: (row.new_values as Record<string, unknown>) ?? null,
    createdAt: row.created_at,
  };
}

export class HistoryRepository {
  async add(input: RecordHistoryInput): Promise<ChangeHistoryRecord> {
    const result = await pool.query(
      `INSERT INTO entity_change_history (actor_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
       RETURNING id, actor_id, action, entity_type, entity_id, old_values, new_values, created_at`,
      [
        input.actorId,
        input.action,
        input.entityType,
        input.entityId,
        input.oldValues ? JSON.stringify(input.oldValues) : null,
        input.newValues ? JSON.stringify(input.newValues) : null,
      ]
    );
    return rowToRecord(result.rows[0]);
  }

  async list(filters?: HistoryFilters): Promise<ChangeHistoryRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.entityType) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(filters.entityType);
    }
    if (filters?.entityId !== undefined) {
      conditions.push(`entity_id = $${paramIndex++}`);
      params.push(filters.entityId);
    }
    if (filters?.actorId !== undefined) {
      conditions.push(`actor_id = $${paramIndex++}`);
      params.push(filters.actorId);
    }
    if (filters?.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(Math.max(filters?.limit ?? 100, 1), 1000);
    const offset = Math.max(filters?.offset ?? 0, 0);
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT id, actor_id, action, entity_type, entity_id, old_values, new_values, created_at
       FROM entity_change_history
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );
    return result.rows.map((row) => rowToRecord(row));
  }

  async deleteOlderThanOneYear(): Promise<number> {
    const result = await pool.query(
      "SELECT cleanup_entity_change_history_older_than_1_year() AS deleted"
    );
    const deleted = result.rows[0]?.deleted;
    return typeof deleted === 'string' ? parseInt(deleted, 10) : Number(deleted) || 0;
  }
}
