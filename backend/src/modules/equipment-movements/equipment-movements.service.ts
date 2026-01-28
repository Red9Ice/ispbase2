/**
 * @file: equipment-movements.service.ts
 * @description: Equipment movements service interface.
 * @dependencies: backend/src/modules/equipment-movements/dto/equipment-movement.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentMovementDto } from './dto/equipment-movement.dto';

export interface EquipmentMovementsService {
  list(): Promise<EquipmentMovementDto[]>;
  getById(id: number): Promise<EquipmentMovementDto | null>;
  findByEquipmentId(equipmentId: number): Promise<EquipmentMovementDto[]>;
  findByEventId(eventId: number): Promise<EquipmentMovementDto[]>;
  create(payload: EquipmentMovementDto): Promise<EquipmentMovementDto>;
}
