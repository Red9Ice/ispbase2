/**
 * @file: equipment-categories.service.impl.ts
 * @description: In-memory equipment categories service implementation.
 * @dependencies: backend/src/modules/equipment-categories/equipment-categories.repository.ts
 * @created: 2026-01-27
 */

import { EquipmentCategoryDto } from './dto/equipment-category.dto';
import { EquipmentCategoriesRepository } from './equipment-categories.repository';
import { EquipmentCategoriesService } from './equipment-categories.service';

const isNonEmptyString = (value: string | undefined, min: number, max: number): boolean =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

const validateCategoryPayload = (payload: EquipmentCategoryDto): void => {
  if (!isNonEmptyString(payload.name, 1, 100)) {
    throw new Error('Invalid category name');
  }
};

export class EquipmentCategoriesServiceImpl implements EquipmentCategoriesService {
  constructor(private readonly repository: EquipmentCategoriesRepository) {}

  async list(): Promise<EquipmentCategoryDto[]> {
    return this.repository.list();
  }

  async create(payload: EquipmentCategoryDto): Promise<EquipmentCategoryDto> {
    validateCategoryPayload(payload);
    return this.repository.create(payload);
  }

  async getById(id: number): Promise<EquipmentCategoryDto | null> {
    return this.repository.getById(id) ?? null;
  }

  async update(id: number, payload: Partial<EquipmentCategoryDto>): Promise<EquipmentCategoryDto> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error('Category not found');
    }
    const merged = { ...existing, ...payload };
    validateCategoryPayload(merged);
    const updated = this.repository.update(id, payload);
    if (!updated) {
      throw new Error('Category not found');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const deleted = this.repository.delete(id);
    if (!deleted) {
      throw new Error('Category not found');
    }
  }
}
