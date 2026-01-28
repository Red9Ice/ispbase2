/**
 * @file: equipment-movement.dto.ts
 * @description: DTOs for equipment movements.
 * @dependencies: none
 * @created: 2026-01-27
 */

export type MovementType = 'in' | 'out' | 'transfer' | 'maintenance';

export interface EquipmentMovementDto {
  equipmentId: number;
  movementType: MovementType;
  fromLocation?: string;
  toLocation?: string;
  eventId?: number;
  notes?: string;
  movedAt: string;
}
