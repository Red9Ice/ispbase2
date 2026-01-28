/**
 * @file: staff.validation.ts
 * @description: Draft validation rules for staff.
 * @dependencies: backend/src/modules/staff/dto/staff.dto.ts
 * @created: 2026-01-26
 */

import { StaffDto } from '../dto/staff.dto';

export const staffValidationRules = {
  firstName: { required: true, min: 2, max: 100 },
  lastName: { required: true, min: 2, max: 100 },
  email: { required: true, format: 'email' },
  rate: { min: 0 },
  currency: { enum: ['RUB'] },
  status: { enum: ['active', 'inactive'] }
} as const;

export type StaffValidationRules = typeof staffValidationRules;

export const validateStaffDraft = (_payload: StaffDto): boolean => {
  return true;
};
