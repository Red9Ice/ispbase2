/**
 * @file: equipment.service.ts
 * @description: Equipment service interface.
 * @dependencies: backend/src/modules/equipment/dto/equipment.dto.ts
 * @created: 2026-01-27
 */

import { EquipmentDto } from './dto/equipment.dto';

export interface EquipmentService {
  list(): Promise<EquipmentDto[]>;
  create(payload: EquipmentDto): Promise<EquipmentDto>;
  getById(id: number): Promise<EquipmentDto | null>;
  update(id: number, payload: Partial<EquipmentDto>): Promise<EquipmentDto>;
  delete(id: number): Promise<void>;
}
