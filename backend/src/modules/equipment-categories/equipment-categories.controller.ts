/**
 * @file: equipment-categories.controller.ts
 * @description: Equipment categories controller.
 * @dependencies: backend/src/modules/equipment-categories/dto/equipment-category.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentCategoryDto } from './dto/equipment-category.dto';
import { EquipmentCategoriesService } from './equipment-categories.service';

export class EquipmentCategoriesController {
  constructor(private readonly service: EquipmentCategoriesService) {}

  async list(): Promise<EquipmentCategoryDto[]> {
    return this.service.list();
  }

  async create(payload: EquipmentCategoryDto): Promise<EquipmentCategoryDto> {
    return this.service.create(payload);
  }

  async getById(id: number): Promise<EquipmentCategoryDto | null> {
    return this.service.getById(id);
  }

  async update(id: number, payload: Partial<EquipmentCategoryDto>): Promise<EquipmentCategoryDto> {
    return this.service.update(id, payload);
  }

  async delete(id: number): Promise<void> {
    return this.service.delete(id);
  }
}
