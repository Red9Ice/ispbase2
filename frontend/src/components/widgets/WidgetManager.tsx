/**
 * @file: WidgetManager.tsx
 * @description: Менеджер виджетов для добавления и управления виджетами на dashboard
 * @created: 2026-01-27
 */

import { useState } from 'react';
import type { WidgetConfig, WidgetType } from '../../types/widgets';
import { widgetRegistry } from './widgetRegistry';
import './WidgetManager.css';

interface WidgetManagerProps {
  widgets: WidgetConfig[];
  onToggleWidget: (widgetId: string) => void;
  onAddWidget?: (type: WidgetType) => void;
  onClose: () => void;
}

const getWidgetIcon = (type: WidgetType) => {
  switch (type) {
    case 'stats':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="13" width="4" height="6" rx="1" fill="currentColor" />
          <rect x="9" y="9" width="4" height="10" rx="1" fill="currentColor" />
          <rect x="15" y="5" width="4" height="14" rx="1" fill="currentColor" />
        </svg>
      );
    case 'charts':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 18L9 12L13 16L21 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="8" r="2" fill="currentColor" />
        </svg>
      );
    case 'tasks':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
          <circle cx="7" cy="8" r="1" fill="currentColor" />
          <circle cx="7" cy="13" r="1" fill="currentColor" />
          <circle cx="7" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    case 'nearestEvents':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'activeStaff':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'clock':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'weather':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
};

export function WidgetManager({ widgets, onToggleWidget, onAddWidget, onClose }: WidgetManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWidgets = Object.entries(widgetRegistry).filter(([type, config]) => {
    const matchesSearch = config.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (config.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const visibleCount = widgets.filter(w => w.visible).length;

  return (
    <div className="widget-manager-overlay" onClick={onClose}>
      <div className="widget-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="widget-manager-header">
          <div>
            <h2>Управление виджетами</h2>
            {visibleCount > 0 && (
              <p className="widget-manager-subtitle">
                Активных виджетов: {visibleCount}
              </p>
            )}
          </div>
          <button className="widget-manager-close" onClick={onClose}>×</button>
        </div>
        <div className="widget-manager-search">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="widget-manager-search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Поиск виджетов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="widget-manager-search-input"
          />
        </div>
        <div className="widget-manager-list">
          {filteredWidgets.length === 0 ? (
            <div className="widget-manager-empty">
              <p>Виджеты не найдены</p>
            </div>
          ) : (
            filteredWidgets.map(([type, config]) => {
              const widget = widgets.find(w => w.type === type);
              const isVisible = widget ? widget.visible : false;
              
              return (
                <div
                  key={type}
                  className={`widget-manager-item ${isVisible ? 'active' : ''}`}
                  onClick={() => {
                    if (widget) {
                      onToggleWidget(widget.id);
                    } else if (onAddWidget) {
                      onAddWidget(type as WidgetType);
                    }
                  }}
                >
                  <div className="widget-manager-item-icon">
                    {getWidgetIcon(type as WidgetType)}
                  </div>
                  <div className="widget-manager-item-info">
                    <h3>{config.title}</h3>
                    <p className="widget-manager-item-description">
                      {config.description ?? 'Виджет для dashboard'}
                    </p>
                  </div>
                  <label className="widget-manager-toggle" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => {
                        if (widget) {
                          onToggleWidget(widget.id);
                        } else if (onAddWidget) {
                          onAddWidget(type as WidgetType);
                        }
                      }}
                    />
                    <span className="widget-manager-toggle-slider"></span>
                  </label>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
