/**
 * @file: staff.controller.ts
 * @description: Staff controller placeholder.
 * @dependencies: backend/src/modules/staff/dto/staff.dto.ts
 * @created: 2026-01-26
 */

import { StaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

export class StaffController {
  constructor(private readonly service: StaffService) {}

  async list(): Promise<StaffDto[]> {
    return this.service.list();
  }

  async create(payload: StaffDto): Promise<StaffDto> {
    return this.service.create(payload);
  }

  async getById(id: number): Promise<StaffDto | null> {
    return this.service.getById(id);
  }

  async update(id: number, payload: Partial<StaffDto>): Promise<StaffDto> {
    return this.service.update(id, payload);
  }

  async deactivate(id: number): Promise<void> {
    return this.service.deactivate(id);
  }
}
