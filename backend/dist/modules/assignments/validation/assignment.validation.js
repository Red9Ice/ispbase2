"use strict";
/**
 * @file: assignment.validation.ts
 * @description: Draft validation rules for assignments.
 * @dependencies: backend/src/modules/assignments/dto/assignment.dto.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAssignmentDraft = exports.assignmentValidationRules = void 0;
exports.assignmentValidationRules = {
    eventId: { positive: true },
    staffId: { positive: true },
    roleId: { positive: true },
    timeRange: { compare: 'startTime<endTime' },
    status: { enum: ['planned', 'confirmed', 'completed', 'canceled'] }
};
const validateAssignmentDraft = (_payload) => {
    return true;
};
exports.validateAssignmentDraft = validateAssignmentDraft;
