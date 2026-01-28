/**
 * @file: staff.service.ts
 * @description: Staff service placeholder.
 * @dependencies: backend/src/modules/staff/dto/staff.dto.ts
 * @created: 2026-01-26
 */

import { StaffDto } from './dto/staff.dto';

export interface StaffService {
  list(): Promise<StaffDto[]>;
  create(payload: StaffDto): Promise<StaffDto>;
  getById(id: number): Promise<StaffDto | null>;
  update(id: number, payload: Partial<StaffDto>): Promise<StaffDto>;
  deactivate(id: number): Promise<void>;
}
