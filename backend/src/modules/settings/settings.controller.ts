/**
 * @file: settings.controller.ts
 * @description: Settings controller.
 * @dependencies: settings.service.ts, settings.dto.ts
 * @created: 2026-01-27
 */

import { SettingsService } from './settings.service';
import { SettingsDto } from './dto/settings.dto';

export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  async get(): Promise<SettingsDto> {
    return this.service.get();
  }

  async update(settings: Partial<SettingsDto>): Promise<SettingsDto> {
    return this.service.update(settings);
  }

  async reset(): Promise<SettingsDto> {
    return this.service.reset();
  }
}
