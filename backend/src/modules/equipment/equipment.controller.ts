/**
 * @file: equipment.controller.ts
 * @description: Equipment controller.
 * @dependencies: backend/src/modules/equipment/dto/equipment.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentDto } from './dto/equipment.dto';
import { EquipmentService } from './equipment.service';

export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  async list(): Promise<EquipmentDto[]> {
    return this.service.list();
  }

  async create(payload: EquipmentDto): Promise<EquipmentDto> {
    return this.service.create(payload);
  }

  async getById(id: number): Promise<EquipmentDto | null> {
    return this.service.getById(id);
  }

  async update(id: number, payload: Partial<EquipmentDto>): Promise<EquipmentDto> {
    return this.service.update(id, payload);
  }

  async delete(id: number): Promise<void> {
    return this.service.delete(id);
  }
}
