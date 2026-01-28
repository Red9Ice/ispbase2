/**
 * @file: settings.service.impl.ts
 * @description: Settings service implementation.
 * @dependencies: settings.service.ts, settings.repository.ts
 * @created: 2026-01-27
 */

import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { SettingsDto } from './dto/settings.dto';

export class SettingsServiceImpl implements SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async get(): Promise<SettingsDto> {
    return this.repository.get();
  }

  async update(settings: Partial<SettingsDto>): Promise<SettingsDto> {
    return this.repository.update(settings);
  }

  async reset(): Promise<SettingsDto> {
    return this.repository.reset();
  }
}
