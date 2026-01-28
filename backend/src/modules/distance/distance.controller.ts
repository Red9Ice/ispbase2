/**
 * @file: distance.controller.ts
 * @description: Distance controller.
 * @dependencies: distance.service.ts, distance.dto.ts
 * @created: 2026-01-28
 */

import { DistanceService } from './distance.service';
import { DistanceDto } from './dto/distance.dto';

export class DistanceController {
  constructor(private readonly service: DistanceService) {}

  async getDistanceAndTime(city: string, fromCity?: string): Promise<DistanceDto | null> {
    return this.service.getDistanceAndTime(city, fromCity);
  }
}
