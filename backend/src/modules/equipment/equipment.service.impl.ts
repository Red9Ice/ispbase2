/**
 * @file: equipment.service.impl.ts
 * @description: In-memory equipment service implementation.
 * @dependencies: backend/src/modules/equipment/equipment.repository.ts
 * @created: 2026-01-27
 */

import { EquipmentDto } from './dto/equipment.dto';
import { EquipmentRepository } from './equipment.repository';
import { EquipmentService } from './equipment.service';

const isNonEmptyString = (value: string | undefined, min: number, max: number): boolean =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

const validateEquipmentPayload = (payload: EquipmentDto): void => {
  if (!isNonEmptyString(payload.name, 1, 200)) {
    throw new Error('Invalid equipment name');
  }
  const validStatuses: EquipmentDto['status'][] = ['available', 'in_use', 'maintenance', 'retired'];
  if (!validStatuses.includes(payload.status)) {
    throw new Error('Invalid status');
  }
};

export class EquipmentServiceImpl implements EquipmentService {
  constructor(private readonly repository: EquipmentRepository) {}

  async list(): Promise<EquipmentDto[]> {
    return this.repository.list();
  }

  async create(payload: EquipmentDto): Promise<EquipmentDto> {
    validateEquipmentPayload(payload);
    // Проверка уникальности серийного номера, если указан
    if (payload.serialNumber) {
      const existing = this.repository.findBySerialNumber(payload.serialNumber);
      if (existing) {
        throw new Error('Equipment with this serial number already exists');
      }
    }
    return this.repository.create(payload);
  }

  async getById(id: number): Promise<EquipmentDto | null> {
    return this.repository.getById(id) ?? null;
  }

  async update(id: number, payload: Partial<EquipmentDto>): Promise<EquipmentDto> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error('Equipment not found');
    }
    // Проверка уникальности серийного номера при обновлении
    if (payload.serialNumber && payload.serialNumber !== existing.serialNumber) {
      const existingBySerial = this.repository.findBySerialNumber(payload.serialNumber);
      if (existingBySerial && existingBySerial.id !== id) {
        throw new Error('Equipment with this serial number already exists');
      }
    }
    const merged = { ...existing, ...payload };
    validateEquipmentPayload(merged);
    const updated = this.repository.update(id, payload);
    if (!updated) {
      throw new Error('Equipment not found');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const deleted = this.repository.delete(id);
    if (!deleted) {
      throw new Error('Equipment not found');
    }
  }
}
