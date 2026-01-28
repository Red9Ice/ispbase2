/**
 * @file: Settings.tsx
 * @description: Компонент настроек для редактирования статусов и цветов дизайна.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { SettingsDto, StatusConfig, ThemeColors, ThemeColorsDark } from '../services/api';
import './Settings.css';

// Функция для конвертации rgba/rgb в hex для input type="color"
function colorToHex(color: string): string {
  if (!color) return '#000000';
  
  // Если уже hex формат, возвращаем как есть
  if (color.startsWith('#')) {
    return color.length === 7 ? color : '#000000';
  }
  
  // Пытаемся распарсить rgba/rgb
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1] || '0', 10);
    const g = parseInt(rgbaMatch[2] || '0', 10);
    const b = parseInt(rgbaMatch[3] || '0', 10);
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  }
  
  // Если не удалось распарсить, возвращаем черный
  return '#000000';
}

function applyStatusColors(data: SettingsDto): void {
  const addStatusStyle = (status: StatusConfig, prefix: 'event' | 'staff') => {
    const id = `${prefix}-status-${status.code}`;
    const className = `.tag.${status.code}`;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      ${className} {
        background: ${status.backgroundColor} !important;
        color: ${status.textColor} !important;
      }
      [data-theme="dark"] ${className} {
        background: ${status.backgroundColorDark || status.backgroundColor} !important;
        color: ${status.textColorDark || status.textColor} !important;
      }
    `;
    const oldStyle = document.getElementById(id);
    if (oldStyle) oldStyle.remove();
    document.head.appendChild(style);
  };
  data.eventStatuses.forEach((s) => addStatusStyle(s, 'event'));
  data.staffStatuses.forEach((s) => addStatusStyle(s, 'staff'));
}

function applyThemeColors(data: SettingsDto): void {
  const root = document.documentElement;
  const themeColors = data.themeColors;
  const themeColorsDark = data.themeColorsDark;

  root.style.setProperty('--color-accent', themeColors.colorAccent);
  root.style.setProperty('--color-accent-hover', themeColors.colorAccentHover);
  root.style.setProperty('--color-accent-light', themeColors.colorAccentLight);
  root.style.setProperty('--color-accent-dark', themeColors.colorAccentDark);
  root.style.setProperty('--bg-primary', themeColors.bgPrimary);
  root.style.setProperty('--bg-secondary', themeColors.bgSecondary);
  root.style.setProperty('--bg-tertiary', themeColors.bgTertiary);
  root.style.setProperty('--bg-sidebar', themeColors.bgSidebar);
  root.style.setProperty('--bg-sidebar-hover', themeColors.bgSidebarHover);
  root.style.setProperty('--bg-sidebar-active', themeColors.bgSidebarActive);
  root.style.setProperty('--text-primary', themeColors.textPrimary);
  root.style.setProperty('--text-secondary', themeColors.textSecondary);
  root.style.setProperty('--text-tertiary', themeColors.textTertiary);
  root.style.setProperty('--text-sidebar', themeColors.textSidebar);
  root.style.setProperty('--text-sidebar-active', themeColors.textSidebarActive);
  root.style.setProperty('--border-color', themeColors.borderColor);
  root.style.setProperty('--border-color-strong', themeColors.borderColorStrong);
  root.style.setProperty('--border-sidebar', themeColors.borderSidebar);
  root.style.setProperty('--card-bg', themeColors.cardBg);
  root.style.setProperty('--card-border', themeColors.cardBorder);
  root.style.setProperty('--input-bg', themeColors.inputBg);
  root.style.setProperty('--input-border', themeColors.inputBorder);
  root.style.setProperty('--input-focus', themeColors.inputFocus);
  root.style.setProperty('--table-header-bg', themeColors.tableHeaderBg);
  root.style.setProperty('--table-row-hover', themeColors.tableRowHover);

  const darkTheme = document.querySelector('[data-theme="dark"]');
  if (darkTheme) {
    const el = darkTheme as HTMLElement;
    el.style.setProperty('--bg-primary', themeColorsDark.bgPrimary);
    el.style.setProperty('--bg-secondary', themeColorsDark.bgSecondary);
    el.style.setProperty('--bg-tertiary', themeColorsDark.bgTertiary);
    el.style.setProperty('--bg-sidebar', themeColorsDark.bgSidebar);
    el.style.setProperty('--bg-sidebar-hover', themeColorsDark.bgSidebarHover);
    el.style.setProperty('--bg-sidebar-active', themeColorsDark.bgSidebarActive);
    el.style.setProperty('--text-primary', themeColorsDark.textPrimary);
    el.style.setProperty('--text-secondary', themeColorsDark.textSecondary);
    el.style.setProperty('--text-tertiary', themeColorsDark.textTertiary);
    el.style.setProperty('--text-sidebar', themeColorsDark.textSidebar);
    el.style.setProperty('--text-sidebar-active', themeColorsDark.textSidebarActive);
    el.style.setProperty('--border-color', themeColorsDark.borderColor);
    el.style.setProperty('--border-color-strong', themeColorsDark.borderColorStrong);
    el.style.setProperty('--border-sidebar', themeColorsDark.borderSidebar);
    el.style.setProperty('--card-bg', themeColorsDark.cardBg);
    el.style.setProperty('--card-border', themeColorsDark.cardBorder);
    el.style.setProperty('--input-bg', themeColorsDark.inputBg);
    el.style.setProperty('--input-border', themeColorsDark.inputBorder);
    el.style.setProperty('--input-focus', themeColorsDark.inputFocus);
    el.style.setProperty('--table-header-bg', themeColorsDark.tableHeaderBg);
    el.style.setProperty('--table-row-hover', themeColorsDark.tableRowHover);
  }

  applyStatusColors(data);
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'statuses' | 'theme'>('statuses');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.settings.get();
      setSettings(data);
      applyThemeColors(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Не удалось загрузить настройки' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const updated = await api.settings.update(settings);
      setSettings(updated);
      applyThemeColors(updated);
      setMessage({ type: 'success', text: 'Настройки успешно сохранены' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Не удалось сохранить настройки' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      return;
    }

    try {
      setSaving(true);
      const reset = await api.settings.reset();
      setSettings(reset);
      applyThemeColors(reset);
      setMessage({ type: 'success', text: 'Настройки сброшены к значениям по умолчанию' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage({ type: 'error', text: 'Не удалось сбросить настройки' });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = (type: 'event' | 'staff', index: number, field: keyof StatusConfig, value: string) => {
    if (!settings) return;

    const statuses = type === 'event' ? settings.eventStatuses : settings.staffStatuses;
    const updated = [...statuses];
    updated[index] = { ...updated[index], [field]: value };
    
    setSettings({
      ...settings,
      [type === 'event' ? 'eventStatuses' : 'staffStatuses']: updated,
    });
  };

  const updateThemeColor = (theme: 'light' | 'dark', field: keyof ThemeColors | keyof ThemeColorsDark, value: string) => {
    if (!settings) return;

    const themeKey = theme === 'light' ? 'themeColors' : 'themeColorsDark';
    setSettings({
      ...settings,
      [themeKey]: {
        ...settings[themeKey],
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <section className="settings-page">
        <div className="empty-state">Загрузка настроек...</div>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="settings-page">
        <div className="empty-state">Не удалось загрузить настройки</div>
      </section>
    );
  }

  return (
    <section className="settings-page">
      <div className="settings-header">
        <h1 style={{ display: 'none' }}>Настройки</h1>
        <div className="settings-actions">
          <button className="button-secondary" onClick={handleReset} disabled={saving}>
            Сбросить
          </button>
          <button className="button-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={activeTab === 'statuses' ? 'settings-tab active' : 'settings-tab'}
          onClick={() => setActiveTab('statuses')}
        >
          Статусы
        </button>
        <button
          className={activeTab === 'theme' ? 'settings-tab active' : 'settings-tab'}
          onClick={() => setActiveTab('theme')}
        >
          Цвета дизайна
        </button>
      </div>

      {activeTab === 'statuses' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Статусы событий</h2>
            <div className="status-list">
              {settings.eventStatuses.map((status, index) => (
                <div key={status.code} className="status-item">
                  <div className="status-info">
                    <div className="status-code">{status.code}</div>
                    <input
                      type="text"
                      className="input"
                      value={status.label}
                      onChange={(e) => updateStatus('event', index, 'label', e.target.value)}
                      placeholder="Название статуса"
                    />
                  </div>
                  <div className="status-colors">
                    <div className="color-group">
                      <label>Фон (светлая тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={status.backgroundColor}
                          onChange={(e) => updateStatus('event', index, 'backgroundColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.backgroundColor}
                          onChange={(e) => updateStatus('event', index, 'backgroundColor', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-group">
                      <label>Текст (светлая тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={status.textColor}
                          onChange={(e) => updateStatus('event', index, 'textColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.textColor}
                          onChange={(e) => updateStatus('event', index, 'textColor', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-group">
                      <label>Фон (темная тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={colorToHex(status.backgroundColorDark || status.backgroundColor)}
                          onChange={(e) => updateStatus('event', index, 'backgroundColorDark', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.backgroundColorDark || status.backgroundColor}
                          onChange={(e) => updateStatus('event', index, 'backgroundColorDark', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-group">
                      <label>Текст (темная тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={colorToHex(status.textColorDark || status.textColor)}
                          onChange={(e) => updateStatus('event', index, 'textColorDark', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.textColorDark || status.textColor}
                          onChange={(e) => updateStatus('event', index, 'textColorDark', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="status-preview">
                    <span
                      className={`tag ${status.code}`}
                      style={{
                        backgroundColor: status.backgroundColor,
                        color: status.textColor,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h2>Статусы персонала</h2>
            <div className="status-list">
              {settings.staffStatuses.map((status, index) => (
                <div key={status.code} className="status-item">
                  <div className="status-info">
                    <div className="status-code">{status.code}</div>
                    <input
                      type="text"
                      className="input"
                      value={status.label}
                      onChange={(e) => updateStatus('staff', index, 'label', e.target.value)}
                      placeholder="Название статуса"
                    />
                  </div>
                  <div className="status-colors">
                    <div className="color-group">
                      <label>Фон (светлая тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={status.backgroundColor}
                          onChange={(e) => updateStatus('staff', index, 'backgroundColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.backgroundColor}
                          onChange={(e) => updateStatus('staff', index, 'backgroundColor', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-group">
                      <label>Текст (светлая тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={status.textColor}
                          onChange={(e) => updateStatus('staff', index, 'textColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.textColor}
                          onChange={(e) => updateStatus('staff', index, 'textColor', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-group">
                      <label>Фон (темная тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={status.backgroundColorDark || status.backgroundColor}
                          onChange={(e) => updateStatus('staff', index, 'backgroundColorDark', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.backgroundColorDark || status.backgroundColor}
                          onChange={(e) => updateStatus('staff', index, 'backgroundColorDark', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-group">
                      <label>Текст (темная тема)</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={status.textColorDark || status.textColor}
                          onChange={(e) => updateStatus('staff', index, 'textColorDark', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          value={status.textColorDark || status.textColor}
                          onChange={(e) => updateStatus('staff', index, 'textColorDark', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="status-preview">
                    <span
                      className={`tag ${status.code}`}
                      style={{
                        backgroundColor: status.backgroundColor,
                        color: status.textColor,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Светлая тема</h2>
            <div className="theme-colors-grid">
              {Object.entries(settings.themeColors).map(([key, value]) => (
                <div key={key} className="theme-color-item">
                  <label>{key}</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateThemeColor('light', key as keyof ThemeColors, e.target.value)}
                    />
                    <input
                      type="text"
                      className="input"
                      value={value}
                      onChange={(e) => updateThemeColor('light', key as keyof ThemeColors, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h2>Темная тема</h2>
            <div className="theme-colors-grid">
              {Object.entries(settings.themeColorsDark).map(([key, value]) => (
                <div key={key} className="theme-color-item">
                  <label>{key}</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateThemeColor('dark', key as keyof ThemeColorsDark, e.target.value)}
                    />
                    <input
                      type="text"
                      className="input"
                      value={value}
                      onChange={(e) => updateThemeColor('dark', key as keyof ThemeColorsDark, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
