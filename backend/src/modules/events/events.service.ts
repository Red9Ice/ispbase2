/**
 * @file: events.service.ts
 * @description: Events service placeholder.
 * @dependencies: backend/src/modules/events/dto/event.dto.ts
 * @created: 2026-01-26
 */

import { EventDto, EventStatus } from './dto/event.dto';

export interface EventFilters {
  status?: EventStatus;
  startFrom?: string;
  endTo?: string;
  clientId?: number;
  venueId?: number;
  managerId?: number;
  q?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: 'startDate' | 'endDate' | 'status' | 'contractPrice' | 'createdAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface EventsService {
  list(filters?: EventFilters): Promise<EventDto[]>;
  create(payload: EventDto): Promise<EventDto>;
  getById(id: number): Promise<EventDto | null>;
  update(id: number, payload: Partial<EventDto>): Promise<EventDto>;
  remove(id: number): Promise<void>;
}
