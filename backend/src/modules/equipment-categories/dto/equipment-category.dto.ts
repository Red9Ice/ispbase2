/**
 * @file: equipment-category.dto.ts
 * @description: DTOs for equipment categories.
 * @dependencies: none
 * @created: 2026-01-27
 */

export interface EquipmentCategoryDto {
  name: string;
  description?: string;
  parentId?: number | null;
}
