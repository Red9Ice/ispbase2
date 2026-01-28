/**
 * @file: staff.service.impl.ts
 * @description: In-memory staff service implementation.
 * @dependencies: backend/src/modules/staff/staff.repository.ts
 * @created: 2026-01-26
 */

import { StaffDto } from './dto/staff.dto';
import { StaffRepository } from './staff.repository';
import { StaffService } from './staff.service';
import { staffValidationRules } from './validation/staff.validation';

const isNonEmptyString = (value: string | undefined, min: number, max: number): boolean =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const isEmailLike = (value: string | undefined): boolean =>
  typeof value === 'string' && value.includes('@');
const isNonNegative = (value: number | undefined): boolean =>
  typeof value === 'number' && value >= 0;

const validateStaffPayload = (payload: StaffDto): void => {
  if (!isNonEmptyString(payload.firstName, staffValidationRules.firstName.min, staffValidationRules.firstName.max)) {
    throw new Error('Invalid first name');
  }
  if (!isNonEmptyString(payload.lastName, staffValidationRules.lastName.min, staffValidationRules.lastName.max)) {
    throw new Error('Invalid last name');
  }
  if (!isEmailLike(payload.email)) {
    throw new Error('Invalid email');
  }
  if (payload.rate !== undefined && !isNonNegative(payload.rate)) {
    throw new Error('Invalid rate');
  }
  if (!staffValidationRules.currency.enum.includes(payload.currency)) {
    throw new Error('Invalid currency');
  }
  if (!staffValidationRules.status.enum.includes(payload.status)) {
    throw new Error('Invalid status');
  }
};

export class StaffServiceImpl implements StaffService {
  constructor(private readonly repository: StaffRepository) {}

  async list(): Promise<StaffDto[]> {
    return this.repository.list();
  }

  async create(payload: StaffDto): Promise<StaffDto> {
    validateStaffPayload(payload);
    return this.repository.create(payload);
  }

  async getById(id: number): Promise<StaffDto | null> {
    return this.repository.getById(id) ?? null;
  }

  async update(id: number, payload: Partial<StaffDto>): Promise<StaffDto> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error('Staff not found');
    }
    const merged = { ...existing, ...payload };
    validateStaffPayload(merged);
    const updated = this.repository.update(id, payload);
    if (!updated) {
      throw new Error('Staff not found');
    }
    return updated;
  }

  async deactivate(id: number): Promise<void> {
    const updated = this.repository.deactivate(id);
    if (!updated) {
      throw new Error('Staff not found');
    }
  }
}
