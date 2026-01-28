/**
 * @file: equipment-categories.service.ts
 * @description: Equipment categories service interface.
 * @dependencies: backend/src/modules/equipment-categories/dto/equipment-category.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentCategoryDto } from './dto/equipment-category.dto';

export interface EquipmentCategoriesService {
  list(): Promise<EquipmentCategoryDto[]>;
  create(payload: EquipmentCategoryDto): Promise<EquipmentCategoryDto>;
  getById(id: number): Promise<EquipmentCategoryDto | null>;
  update(id: number, payload: Partial<EquipmentCategoryDto>): Promise<EquipmentCategoryDto>;
  delete(id: number): Promise<void>;
}
