/**
 * @file: event.validation.ts
 * @description: Draft validation rules for events.
 * @dependencies: backend/src/modules/events/dto/event.dto.ts
 * @created: 2026-01-26
 */

import { EventDto } from '../dto/event.dto';

export const eventValidationRules = {
  title: { required: true, min: 3, max: 200 },
  dateRange: { compare: 'startDate<=endDate' },
  status: { enum: ['draft', 'request', 'in_work', 'completed', 'canceled'] },
  contractPrice: { min: 0 }, // Цена контракта (было budgetPlanned)
  budgetActual: { min: 0 },
  clientId: { positive: true },
  venueId: { positive: true },
  managerId: { positive: true },
  foremanId: { positive: true },
  margin: { min: 0, max: 100 }, // Маржинальность в процентах (0-100)
  profitability: { min: 0, max: 100 } // Рентабельность в процентах (0-100)
} as const;

export type EventValidationRules = typeof eventValidationRules;

export const validateEventDraft = (_payload: EventDto): boolean => {
  return true;
};
