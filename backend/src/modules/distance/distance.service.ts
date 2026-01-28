/**
 * @file: distance.service.ts
 * @description: Интерфейс сервиса для расчета расстояния и времени поездки
 * @dependencies: distance.dto.ts
 * @created: 2026-01-28
 */

import { DistanceDto } from './dto/distance.dto';

export interface DistanceService {
  getDistanceAndTime(city: string, fromCity?: string): Promise<DistanceDto | null>;
}
