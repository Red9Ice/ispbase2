/**
 * @file: history.service.ts
 * @description: Entity change history service interface.
 * @dependencies: history.dto
 * @created: 2026-01-27
 */

import type { ChangeHistoryRecord, HistoryFilters, RecordHistoryInput } from './dto/history.dto';

export interface HistoryService {
  record(input: RecordHistoryInput): Promise<ChangeHistoryRecord>;
  list(filters?: HistoryFilters): Promise<ChangeHistoryRecord[]>;
  cleanupExpired(): Promise<number>;
}
