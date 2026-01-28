/**
 * @file: history.service.impl.ts
 * @description: Entity change history service implementation.
 * @dependencies: history.repository, history.dto
 * @created: 2026-01-27
 */

import type { ChangeHistoryRecord, HistoryFilters, RecordHistoryInput } from './dto/history.dto';
import { HistoryRepository } from './history.repository';
import type { HistoryService } from './history.service';

function cloneForHistory(
  val: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (val == null) return null;
  try {
    return JSON.parse(JSON.stringify(val)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export class HistoryServiceImpl implements HistoryService {
  constructor(private readonly repository: HistoryRepository) {}

  async record(input: RecordHistoryInput): Promise<ChangeHistoryRecord> {
    const cloned: RecordHistoryInput = {
      ...input,
      oldValues: cloneForHistory(input.oldValues),
      newValues: cloneForHistory(input.newValues),
    };
    return this.repository.add(cloned);
  }

  async list(filters?: HistoryFilters): Promise<ChangeHistoryRecord[]> {
    return this.repository.list(filters);
  }

  async cleanupExpired(): Promise<number> {
    return this.repository.deleteOlderThanOneYear();
  }
}
