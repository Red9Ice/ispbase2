/**
 * @file: settings.dto.ts
 * @description: DTOs for settings module.
 * @dependencies: none
 * @created: 2026-01-27
 */

export interface StatusConfig {
  code: string;
  label: string;
  backgroundColor: string;
  textColor: string;
  backgroundColorDark?: string;
  textColorDark?: string;
}

export interface ThemeColors {
  colorAccent: string;
  colorAccentHover: string;
  colorAccentLight: string;
  colorAccentDark: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgSidebar: string;
  bgSidebarHover: string;
  bgSidebarActive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textSidebar: string;
  textSidebarActive: string;
  borderColor: string;
  borderColorStrong: string;
  borderSidebar: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  tableHeaderBg: string;
  tableRowHover: string;
}

export interface ThemeColorsDark {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgSidebar: string;
  bgSidebarHover: string;
  bgSidebarActive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textSidebar: string;
  textSidebarActive: string;
  borderColor: string;
  borderColorStrong: string;
  borderSidebar: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  tableHeaderBg: string;
  tableRowHover: string;
}

export interface SettingsDto {
  eventStatuses: StatusConfig[];
  staffStatuses: StatusConfig[];
  themeColors: ThemeColors;
  themeColorsDark: ThemeColorsDark;
}
