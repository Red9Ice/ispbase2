/**
 * @file: equipment-movements.repository.ts
 * @description: In-memory repository for equipment movements.
 * @dependencies: backend/src/modules/equipment-movements/dto/equipment-movement.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentMovementDto } from './dto/equipment-movement.dto';

export interface EquipmentMovementRecord extends EquipmentMovementDto {
  id: number;
  createdAt: string;
  createdBy?: number;
}

export class EquipmentMovementsRepository {
  private readonly items: EquipmentMovementRecord[] = [];
  private seq = 1;

  list(): EquipmentMovementRecord[] {
    return [...this.items];
  }

  getById(id: number): EquipmentMovementRecord | undefined {
    return this.items.find((item) => item.id === id);
  }

  findByEquipmentId(equipmentId: number): EquipmentMovementRecord[] {
    return this.items.filter((item) => item.equipmentId === equipmentId);
  }

  findByEventId(eventId: number): EquipmentMovementRecord[] {
    return this.items.filter((item) => item.eventId === eventId);
  }

  create(payload: EquipmentMovementDto): EquipmentMovementRecord {
    const now = new Date().toISOString();
    const record: EquipmentMovementRecord = { 
      id: this.seq++, 
      createdAt: now, 
      ...payload 
    };
    this.items.push(record);
    return record;
  }
}
