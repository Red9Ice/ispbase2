"use strict";
/**
 * @file: events.service.impl.ts
 * @description: In-memory events service implementation.
 * @dependencies: backend/src/modules/events/events.repository.ts
 * @created: 2026-01-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsServiceImpl = void 0;
const event_validation_1 = require("./validation/event.validation");
const isPositive = (value) => typeof value === 'number' && value > 0;
const isNonNegative = (value) => typeof value === 'number' && value >= 0;
const isNonEmptyString = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const validateEventPayload = (payload) => {
    if (!isNonEmptyString(payload.title, event_validation_1.eventValidationRules.title.min, event_validation_1.eventValidationRules.title.max)) {
        throw new Error('Invalid title');
    }
    if (!payload.startDate || !payload.endDate) {
        throw new Error('Invalid dates');
    }
    if (new Date(payload.startDate) > new Date(payload.endDate)) {
        throw new Error('Invalid date range');
    }
    if (!event_validation_1.eventValidationRules.status.enum.includes(payload.status)) {
        throw new Error('Invalid status');
    }
    if (!isNonNegative(payload.contractPrice) || !isNonNegative(payload.budgetActual)) {
        throw new Error('Invalid budget values');
    }
    if (!isPositive(payload.clientId) || !isPositive(payload.venueId)) {
        throw new Error('Invalid client or venue');
    }
};
const validateEventFilters = (filters) => {
    if (!filters) {
        return;
    }
    if (filters.status && !event_validation_1.eventValidationRules.status.enum.includes(filters.status)) {
        throw new Error('Invalid status filter');
    }
    if (filters.startFrom && filters.endTo && new Date(filters.startFrom) > new Date(filters.endTo)) {
        throw new Error('Invalid date filter');
    }
    if (filters.clientId !== undefined && !isPositive(filters.clientId)) {
        throw new Error('Invalid client filter');
    }
    if (filters.venueId !== undefined && !isPositive(filters.venueId)) {
        throw new Error('Invalid venue filter');
    }
    if (filters.minBudget !== undefined && !isNonNegative(filters.minBudget)) {
        throw new Error('Invalid min budget');
    }
    if (filters.maxBudget !== undefined && !isNonNegative(filters.maxBudget)) {
        throw new Error('Invalid max budget');
    }
    if (filters.minBudget !== undefined &&
        filters.maxBudget !== undefined &&
        filters.minBudget > filters.maxBudget) {
        throw new Error('Invalid budget range');
    }
    if (filters.sortBy && !['startDate', 'endDate', 'status', 'contractPrice', 'createdAt'].includes(filters.sortBy)) {
        throw new Error('Invalid sort field');
    }
    if (filters.sortDir && !['asc', 'desc'].includes(filters.sortDir)) {
        throw new Error('Invalid sort direction');
    }
    if (filters.page !== undefined && (!Number.isInteger(filters.page) || filters.page <= 0)) {
        throw new Error('Invalid page');
    }
    if (filters.pageSize !== undefined && (!Number.isInteger(filters.pageSize) || filters.pageSize <= 0)) {
        throw new Error('Invalid page size');
    }
};
class EventsServiceImpl {
    constructor(repository, weatherService, distanceService, venuesRepository) {
        this.repository = repository;
        this.weatherService = weatherService;
        this.distanceService = distanceService;
        this.venuesRepository = venuesRepository;
    }
    async list(filters) {
        validateEventFilters(filters);
        return this.repository.list(filters);
    }
    async create(payload) {
        validateEventPayload(payload);
        return this.repository.create(payload);
    }
    async getById(id) {
        const event = await this.repository.getById(id);
        if (!event) {
            return null;
        }
        // Возвращаем мероприятие сразу без блокирующих внешних API вызовов
        // Погода и расстояние загружаются отдельно на фронтенде при необходимости
        return { ...event };
    }
    async update(id, payload) {
        const existing = await this.repository.getById(id);
        if (!existing) {
            throw new Error('Event not found');
        }
        const merged = { ...existing, ...payload };
        validateEventPayload(merged);
        const updated = await this.repository.update(id, payload);
        if (!updated) {
            throw new Error('Event not found');
        }
        return updated;
    }
    async remove(id) {
        const removed = await this.repository.remove(id);
        if (!removed) {
            throw new Error('Event not found');
        }
    }
}
exports.EventsServiceImpl = EventsServiceImpl;
