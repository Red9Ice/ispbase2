/**
 * @file: history.dto.ts
 * @description: DTOs for entity change history.
 * @dependencies: none
 * @created: 2026-01-27
 */

export type HistoryAction = 'create' | 'update' | 'delete';

export interface ChangeHistoryRecord {
  id: number;
  actorId: number | null;
  action: HistoryAction;
  entityType: string;
  entityId: number;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

export interface RecordHistoryInput {
  actorId: number | null;
  action: HistoryAction;
  entityType: string;
  entityId: number;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

export interface HistoryFilters {
  entityType?: string;
  entityId?: number;
  actorId?: number;
  action?: HistoryAction;
  limit?: number;
  offset?: number;
}
