/**
 * @file: equipment-movements.controller.ts
 * @description: Equipment movements controller.
 * @dependencies: backend/src/modules/equipment-movements/dto/equipment-movement.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentMovementDto } from './dto/equipment-movement.dto';
import { EquipmentMovementsService } from './equipment-movements.service';

export class EquipmentMovementsController {
  constructor(private readonly service: EquipmentMovementsService) {}

  async list(): Promise<EquipmentMovementDto[]> {
    return this.service.list();
  }

  async getById(id: number): Promise<EquipmentMovementDto | null> {
    return this.service.getById(id);
  }

  async findByEquipmentId(equipmentId: number): Promise<EquipmentMovementDto[]> {
    return this.service.findByEquipmentId(equipmentId);
  }

  async findByEventId(eventId: number): Promise<EquipmentMovementDto[]> {
    return this.service.findByEventId(eventId);
  }

  async create(payload: EquipmentMovementDto): Promise<EquipmentMovementDto> {
    return this.service.create(payload);
  }
}
