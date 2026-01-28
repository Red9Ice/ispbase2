/**
 * @file: equipment-movements.service.impl.ts
 * @description: In-memory equipment movements service implementation.
 * @dependencies: backend/src/modules/equipment-movements/equipment-movements.repository.ts
 * @created: 2026-01-27
 */

import { EquipmentMovementDto } from './dto/equipment-movement.dto';
import { EquipmentMovementsRepository } from './equipment-movements.repository';
import { EquipmentMovementsService } from './equipment-movements.service';

const validateMovementPayload = (payload: EquipmentMovementDto): void => {
  const validTypes: EquipmentMovementDto['movementType'][] = ['in', 'out', 'transfer', 'maintenance'];
  if (!validTypes.includes(payload.movementType)) {
    throw new Error('Invalid movement type');
  }
  if (!payload.movedAt) {
    throw new Error('Moved at date is required');
  }
};

export class EquipmentMovementsServiceImpl implements EquipmentMovementsService {
  constructor(private readonly repository: EquipmentMovementsRepository) {}

  async list(): Promise<EquipmentMovementDto[]> {
    return this.repository.list();
  }

  async getById(id: number): Promise<EquipmentMovementDto | null> {
    return this.repository.getById(id) ?? null;
  }

  async findByEquipmentId(equipmentId: number): Promise<EquipmentMovementDto[]> {
    return this.repository.findByEquipmentId(equipmentId);
  }

  async findByEventId(eventId: number): Promise<EquipmentMovementDto[]> {
    return this.repository.findByEventId(eventId);
  }

  async create(payload: EquipmentMovementDto): Promise<EquipmentMovementDto> {
    validateMovementPayload(payload);
    return this.repository.create(payload);
  }
}
