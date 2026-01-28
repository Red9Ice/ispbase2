/**
 * @file: settings.repository.ts
 * @description: Settings repository for storing and retrieving settings.
 * @dependencies: settings.dto.ts
 * @created: 2026-01-27
 */

import { SettingsDto, StatusConfig, ThemeColors, ThemeColorsDark } from './dto/settings.dto';

// In-memory storage (в будущем можно заменить на БД)
let settingsStorage: SettingsDto | null = null;

// Default settings
const defaultEventStatuses: StatusConfig[] = [
  {
    code: 'draft',
    label: 'Черновик',
    backgroundColor: '#F1F5F9',
    textColor: '#64748B',
  },
  {
    code: 'request',
    label: 'Запрос',
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    textColor: '#E67E00',
    backgroundColorDark: 'rgba(255, 140, 0, 0.25)',
    textColorDark: '#FFA500',
  },
  {
    code: 'in_work',
    label: 'В работе',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#1e40af',
    backgroundColorDark: 'rgba(59, 130, 246, 0.25)',
    textColorDark: '#93c5fd',
  },
  {
    code: 'completed',
    label: 'Завершено',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    textColor: '#065f46',
    backgroundColorDark: 'rgba(16, 185, 129, 0.25)',
    textColorDark: '#6ee7b7',
  },
  {
    code: 'canceled',
    label: 'Отменено',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#991b1b',
    backgroundColorDark: 'rgba(239, 68, 68, 0.25)',
    textColorDark: '#fca5a5',
  },
];

const defaultStaffStatuses: StatusConfig[] = [
  {
    code: 'active',
    label: 'Активен',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    textColor: '#065f46',
    backgroundColorDark: 'rgba(16, 185, 129, 0.25)',
    textColorDark: '#6ee7b7',
  },
  {
    code: 'inactive',
    label: 'Неактивен',
    backgroundColor: '#F1F5F9',
    textColor: '#94A3B8',
  },
];

const defaultThemeColors: ThemeColors = {
  colorAccent: '#FF8C00',
  colorAccentHover: '#FF7A00',
  colorAccentLight: '#FFA500',
  colorAccentDark: '#E67E00',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  bgTertiary: '#F1F5F9',
  bgSidebar: '#F5F5F5',
  bgSidebarHover: '#E0E0E0',
  bgSidebarActive: '#FF8C00',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textSidebar: '#333333',
  textSidebarActive: '#FFFFFF',
  borderColor: '#E2E8F0',
  borderColorStrong: '#CBD5E1',
  borderSidebar: '#D0D0D0',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputFocus: '#FF8C00',
  tableHeaderBg: '#F8FAFC',
  tableRowHover: '#F8FAFC',
};

const defaultThemeColorsDark: ThemeColorsDark = {
  bgPrimary: '#121212',
  bgSecondary: '#1A1A1A',
  bgTertiary: '#2A2A2A',
  bgSidebar: '#0F0F0F',
  bgSidebarHover: '#1F1F1F',
  bgSidebarActive: '#FF8C00',
  textPrimary: '#E5E5E5',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textSidebar: '#D0D0D0',
  textSidebarActive: '#FFFFFF',
  borderColor: '#2D2D2D',
  borderColorStrong: '#3D3D3D',
  borderSidebar: '#252525',
  cardBg: '#1E1E1E',
  cardBorder: '#2D2D2D',
  inputBg: '#1E1E1E',
  inputBorder: '#3D3D3D',
  inputFocus: '#FF8C00',
  tableHeaderBg: '#151515',
  tableRowHover: '#2A2A2A',
};

const defaultSettings: SettingsDto = {
  eventStatuses: defaultEventStatuses,
  staffStatuses: defaultStaffStatuses,
  themeColors: defaultThemeColors,
  themeColorsDark: defaultThemeColorsDark,
};

export class SettingsRepository {
  get(): SettingsDto {
    if (!settingsStorage) {
      settingsStorage = { ...defaultSettings };
    }
    return { ...settingsStorage };
  }

  update(settings: Partial<SettingsDto>): SettingsDto {
    if (!settingsStorage) {
      settingsStorage = { ...defaultSettings };
    }
    settingsStorage = {
      ...settingsStorage,
      ...settings,
      eventStatuses: settings.eventStatuses || settingsStorage.eventStatuses,
      staffStatuses: settings.staffStatuses || settingsStorage.staffStatuses,
      themeColors: settings.themeColors || settingsStorage.themeColors,
      themeColorsDark: settings.themeColorsDark || settingsStorage.themeColorsDark,
    };
    return { ...settingsStorage };
  }

  reset(): SettingsDto {
    settingsStorage = { ...defaultSettings };
    return { ...settingsStorage };
  }
}
