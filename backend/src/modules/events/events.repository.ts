/**
 * @file: events.repository.ts
 * @description: PostgreSQL repository for events.
 * @dependencies: backend/src/modules/events/dto/event.dto.ts, backend/src/common/database.ts
 * @created: 2026-01-26
 */

import { EventDto } from './dto/event.dto';
import { EventFilters } from './events.service';
import { pool } from '../../common/database';

export interface EventRecord extends EventDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export class EventsRepository {
  private mapRowToRecord(row: any): EventRecord {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      contractPrice: parseFloat(row.contract_price),
      budgetActual: parseFloat(row.budget_actual),
      clientId: row.client_id,
      venueId: row.venue_id,
      managerId: row.manager_id || undefined,
      foremanId: row.foreman_id || undefined,
      commercialProposal: row.commercial_proposal || undefined,
      opm: row.opm || undefined,
      transport: row.transport || undefined,
      margin: row.margin ? parseFloat(row.margin) : undefined,
      profitability: row.profitability ? parseFloat(row.profitability) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async list(filters?: EventFilters): Promise<EventRecord[]> {
    let query = 'SELECT * FROM event WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.startFrom) {
      query += ` AND start_date >= $${paramIndex++}`;
      params.push(filters.startFrom);
    }

    if (filters?.endTo) {
      query += ` AND end_date <= $${paramIndex++}`;
      params.push(filters.endTo);
    }

    if (filters?.clientId) {
      query += ` AND client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }

    if (filters?.venueId) {
      query += ` AND venue_id = $${paramIndex++}`;
      params.push(filters.venueId);
    }

    if (filters?.managerId !== undefined) {
      if (filters.managerId === null) {
        query += ` AND manager_id IS NULL`;
      } else {
        query += ` AND manager_id = $${paramIndex++}`;
        params.push(filters.managerId);
      }
    }

    if (filters?.minBudget !== undefined) {
      query += ` AND contract_price >= $${paramIndex++}`;
      params.push(filters.minBudget);
    }

    if (filters?.maxBudget !== undefined) {
      query += ` AND contract_price <= $${paramIndex++}`;
      params.push(filters.maxBudget);
    }

    if (filters?.q) {
      query += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex})`;
      params.push(`%${filters.q.toLowerCase()}%`);
      paramIndex++;
    }

    // Сортировка
    const sortBy = filters?.sortBy || 'start_date';
    const sortDir = filters?.sortDir || 'asc';
    const sortByColumn = sortBy === 'startDate' ? 'start_date' :
                        sortBy === 'endDate' ? 'end_date' :
                        sortBy === 'contractPrice' ? 'contract_price' :
                        sortBy === 'createdAt' ? 'created_at' :
                        sortBy;
    query += ` ORDER BY ${sortByColumn} ${sortDir.toUpperCase()}`;

    // Пагинация
    if (filters?.page && filters?.pageSize) {
      const offset = (filters.page - 1) * filters.pageSize;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(filters.pageSize, offset);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => this.mapRowToRecord(row));
  }

  async getById(id: number): Promise<EventRecord | undefined> {
    const result = await pool.query('SELECT * FROM event WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return undefined;
    }
    return this.mapRowToRecord(result.rows[0]);
  }

  async create(payload: EventDto): Promise<EventRecord> {
    const result = await pool.query(
      `INSERT INTO event (
        title, description, start_date, end_date, status,
        contract_price, budget_actual, client_id, venue_id,
        manager_id, foreman_id, commercial_proposal, opm, transport,
        margin, profitability, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        payload.title,
        payload.description || null,
        payload.startDate,
        payload.endDate,
        payload.status,
        payload.contractPrice,
        payload.budgetActual,
        payload.clientId,
        payload.venueId,
        payload.managerId || null,
        payload.foremanId || null,
        payload.commercialProposal || null,
        payload.opm || null,
        payload.transport || null,
        payload.margin || null,
        payload.profitability || null,
      ]
    );
    return this.mapRowToRecord(result.rows[0]);
  }

  async update(id: number, payload: Partial<EventDto>): Promise<EventRecord | undefined> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (payload.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(payload.title);
    }
    if (payload.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(payload.description || null);
    }
    if (payload.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(payload.startDate);
    }
    if (payload.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(payload.endDate);
    }
    if (payload.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(payload.status);
    }
    if (payload.contractPrice !== undefined) {
      updates.push(`contract_price = $${paramIndex++}`);
      params.push(payload.contractPrice);
    }
    if (payload.budgetActual !== undefined) {
      updates.push(`budget_actual = $${paramIndex++}`);
      params.push(payload.budgetActual);
    }
    if (payload.clientId !== undefined) {
      updates.push(`client_id = $${paramIndex++}`);
      params.push(payload.clientId);
    }
    if (payload.venueId !== undefined) {
      updates.push(`venue_id = $${paramIndex++}`);
      params.push(payload.venueId);
    }
    if (payload.managerId !== undefined) {
      updates.push(`manager_id = $${paramIndex++}`);
      params.push(payload.managerId || null);
    }
    if (payload.foremanId !== undefined) {
      updates.push(`foreman_id = $${paramIndex++}`);
      params.push(payload.foremanId || null);
    }
    if (payload.commercialProposal !== undefined) {
      updates.push(`commercial_proposal = $${paramIndex++}`);
      params.push(payload.commercialProposal || null);
    }
    if (payload.opm !== undefined) {
      updates.push(`opm = $${paramIndex++}`);
      params.push(payload.opm || null);
    }
    if (payload.transport !== undefined) {
      updates.push(`transport = $${paramIndex++}`);
      params.push(payload.transport || null);
    }
    if (payload.margin !== undefined) {
      updates.push(`margin = $${paramIndex++}`);
      params.push(payload.margin || null);
    }
    if (payload.profitability !== undefined) {
      updates.push(`profitability = $${paramIndex++}`);
      params.push(payload.profitability || null);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE event SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapRowToRecord(result.rows[0]);
  }

  async remove(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM event WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
