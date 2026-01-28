"use strict";
/**
 * @file: staff.validation.ts
 * @description: Draft validation rules for staff.
 * @dependencies: backend/src/modules/staff/dto/staff.dto.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStaffDraft = exports.staffValidationRules = void 0;
exports.staffValidationRules = {
    firstName: { required: true, min: 2, max: 100 },
    lastName: { required: true, min: 2, max: 100 },
    email: { required: true, format: 'email' },
    rate: { min: 0 },
    currency: { enum: ['RUB'] },
    status: { enum: ['active', 'inactive'] }
};
const validateStaffDraft = (_payload) => {
    return true;
};
exports.validateStaffDraft = validateStaffDraft;
