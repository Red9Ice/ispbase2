/**
 * @file: assignments.repository.ts
 * @description: In-memory repository for assignments.
 * @dependencies: backend/src/modules/assignments/dto/assignment.dto.ts
 * @created: 2026-01-26
 */

import { AssignmentDto } from './dto/assignment.dto';
import { AssignmentFilters } from './assignments.service';

export interface AssignmentRecord extends AssignmentDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export class AssignmentsRepository {
  private readonly items: AssignmentRecord[] = [];
  private seq = 1;

  listByEvent(eventId: number, filters?: AssignmentFilters): AssignmentRecord[] {
    const byEvent = this.items.filter((item) => item.eventId === eventId);
    if (!filters) {
      return byEvent;
    }
    return byEvent.filter((item) => {
      const statusMatch = filters.status ? item.status === filters.status : true;
      const startMatch = filters.startFrom ? item.startTime >= filters.startFrom : true;
      const endMatch = filters.endTo ? item.endTime <= filters.endTo : true;
      return statusMatch && startMatch && endMatch;
    });
  }

  listAll(): AssignmentRecord[] {
    return [...this.items];
  }

  getById(id: number): AssignmentRecord | undefined {
    return this.items.find((item) => item.id === id);
  }

  create(payload: AssignmentDto): AssignmentRecord {
    const now = new Date().toISOString();
    const record: AssignmentRecord = { id: this.seq++, createdAt: now, updatedAt: now, ...payload };
    this.items.push(record);
    return record;
  }

  update(id: number, payload: Partial<AssignmentDto>): AssignmentRecord | undefined {
    const item = this.getById(id);
    if (!item) {
      return undefined;
    }
    const updated = { ...item, ...payload, updatedAt: new Date().toISOString() };
    const index = this.items.findIndex((entry) => entry.id === id);
    this.items[index] = updated;
    return updated;
  }

  remove(id: number): boolean {
    const index = this.items.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return false;
    }
    this.items.splice(index, 1);
    return true;
  }
}
