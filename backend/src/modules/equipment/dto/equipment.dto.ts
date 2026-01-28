/**
 * @file: equipment.dto.ts
 * @description: DTOs for equipment.
 * @dependencies: none
 * @created: 2026-01-27
 */

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export interface EquipmentDto {
  name: string;
  model?: string;
  manufacturer?: string;
  categoryId: number;
  serialNumber?: string;
  photoUrl?: string;
  status: EquipmentStatus;
  description?: string;
}
