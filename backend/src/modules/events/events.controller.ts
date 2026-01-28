/**
 * @file: events.controller.ts
 * @description: Events controller placeholder.
 * @dependencies: backend/src/modules/events/dto/event.dto.ts
 * @created: 2026-01-26
 */

import { EventDto } from './dto/event.dto';
import { EventFilters, EventsService } from './events.service';

export class EventsController {
  constructor(private readonly service: EventsService) {}

  async list(filters?: EventFilters): Promise<EventDto[]> {
    return this.service.list(filters);
  }

  async create(payload: EventDto): Promise<EventDto> {
    return this.service.create(payload);
  }

  async getById(id: number): Promise<EventDto | null> {
    return this.service.getById(id);
  }

  async update(id: number, payload: Partial<EventDto>): Promise<EventDto> {
    return this.service.update(id, payload);
  }

  async remove(id: number): Promise<void> {
    return this.service.remove(id);
  }
}
