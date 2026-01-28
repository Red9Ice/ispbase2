/**
 * @file: staff-report.controller.ts
 * @description: Staff report controller placeholder.
 * @dependencies: backend/src/modules/reports/staff-report.service.ts
 * @created: 2026-01-26
 */

import { StaffUtilizationDto } from './dto/staff-utilization.dto';
import { StaffReportService } from './staff-report.service';

export class StaffReportController {
  constructor(private readonly service: StaffReportService) {}

  async getUtilization(): Promise<StaffUtilizationDto[]> {
    return this.service.buildUtilization();
  }
}
