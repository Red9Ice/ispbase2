/**
 * @file: settings.service.ts
 * @description: Settings service interface.
 * @dependencies: settings.dto.ts
 * @created: 2026-01-27
 */

import { SettingsDto } from './dto/settings.dto';

export interface SettingsService {
  get(): Promise<SettingsDto>;
  update(settings: Partial<SettingsDto>): Promise<SettingsDto>;
  reset(): Promise<SettingsDto>;
}
