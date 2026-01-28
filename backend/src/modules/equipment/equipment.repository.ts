/**
 * @file: equipment.repository.ts
 * @description: In-memory repository for equipment.
 * @dependencies: backend/src/modules/equipment/dto/equipment.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentDto } from './dto/equipment.dto';

export interface EquipmentRecord extends EquipmentDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export class EquipmentRepository {
  private readonly items: EquipmentRecord[] = [];
  private seq = 1;

  list(): EquipmentRecord[] {
    return [...this.items];
  }

  getById(id: number): EquipmentRecord | undefined {
    return this.items.find((item) => item.id === id);
  }

  findBySerialNumber(serialNumber: string): EquipmentRecord | undefined {
    return this.items.find((item) => item.serialNumber === serialNumber);
  }

  create(payload: EquipmentDto): EquipmentRecord {
    const now = new Date().toISOString();
    const record: EquipmentRecord = { id: this.seq++, createdAt: now, updatedAt: now, ...payload };
    this.items.push(record);
    return record;
  }

  update(id: number, payload: Partial<EquipmentDto>): EquipmentRecord | undefined {
    const index = this.items.findIndex((entry) => entry.id === id);
    if (index < 0) return undefined;
    const updated = { ...this.items[index], ...payload, updatedAt: new Date().toISOString() };
    this.items[index] = updated;
    return updated;
  }

  delete(id: number): boolean {
    const index = this.items.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return false;
    }
    this.items.splice(index, 1);
    return true;
  }
}
