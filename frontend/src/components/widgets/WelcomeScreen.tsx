/**
 * @file: WelcomeScreen.tsx
 * @description: Приветственный экран для настройки dashboard
 * @dependencies: widgetRegistry
 * @created: 2026-01-27
 */

import { useState } from 'react';
import { widgetRegistry } from './widgetRegistry';
import type { WidgetType } from '../../types/widgets';
import { LogoIcon } from '../LogoIcon';
import { ParticlesAnimation } from './ParticlesAnimation';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onStartSetup: () => void;
  onAddWidget: (type: WidgetType) => void;
  existingWidgets: Array<{ type: WidgetType; visible: boolean }>;
}

export function WelcomeScreen({ onStartSetup, onAddWidget, existingWidgets }: WelcomeScreenProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<Set<WidgetType>>(
    new Set(existingWidgets.filter(w => w.visible).map(w => w.type))
  );

  const handleToggleWidget = (type: WidgetType) => {
    const newSelected = new Set(selectedWidgets);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedWidgets(newSelected);
  };

  const handleCompleteSetup = () => {
    // Добавляем выбранные виджеты
    selectedWidgets.forEach(type => {
      onAddWidget(type);
    });
    onStartSetup();
  };

  const widgetCategories = [
    {
      title: 'Основные',
      widgets: ['stats', 'charts'] as WidgetType[],
    },
    {
      title: 'Мероприятия и задачи',
      widgets: ['tasks', 'nearestEvents'] as WidgetType[],
    },
    {
      title: 'Персонал',
      widgets: ['activeStaff'] as WidgetType[],
    },
    {
      title: 'Дополнительно',
      widgets: ['clock', 'weather'] as WidgetType[],
    },
  ];

  return (
    <div className="welcome-screen">
      <ParticlesAnimation className="welcome-particles-canvas" />
      <div className="welcome-screen-background">
      </div>

      <div className="welcome-screen-content">
        <div className="welcome-header">
          <div className="welcome-icon">
            <LogoIcon width={500} height={168} className="welcome-logo-svg" showText={true} />
          </div>
          <h1 className="welcome-title">Добро пожаловать в Dashboard!</h1>
          <p className="welcome-subtitle">
            Настройте свою панель управления, выбрав виджеты, которые вам нужны
          </p>
        </div>

        <div className="welcome-widgets-selection">
          {widgetCategories.map((category) => (
            <div key={category.title} className="welcome-category">
              <h3 className="welcome-category-title">{category.title}</h3>
              <div className="welcome-widgets-grid">
                {category.widgets.map((type) => {
                  const config = widgetRegistry[type];
                  if (!config) return null;
                  
                  const isSelected = selectedWidgets.has(type);
                  
                  return (
                    <div
                      key={type}
                      className={`welcome-widget-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleWidget(type)}
                    >
                      <div className="welcome-widget-card-checkbox">
                        {isSelected && (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="10" cy="10" r="10" fill="currentColor" />
                            <path
                              d="M6 10L9 13L14 7"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="welcome-widget-card-icon">
                        {type === 'stats' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="13" width="4" height="6" rx="1" fill="currentColor" />
                            <rect x="9" y="9" width="4" height="10" rx="1" fill="currentColor" />
                            <rect x="15" y="5" width="4" height="14" rx="1" fill="currentColor" />
                          </svg>
                        )}
                        {type === 'charts' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 18L9 12L13 16L21 8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="21" cy="8" r="2" fill="currentColor" />
                          </svg>
                        )}
                        {type === 'tasks' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                            <circle cx="7" cy="8" r="1" fill="currentColor" />
                            <circle cx="7" cy="13" r="1" fill="currentColor" />
                            <circle cx="7" cy="18" r="1" fill="currentColor" />
                          </svg>
                        )}
                        {type === 'nearestEvents' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        {type === 'activeStaff' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                            <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        {type === 'clock' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        )}
                        {type === 'weather' && (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </div>
                      <h4 className="welcome-widget-card-title">{config.title}</h4>
                      <p className="welcome-widget-card-description">
                        {config.description || 'Виджет для dashboard'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="welcome-actions">
          <button
            className="welcome-button-secondary"
            onClick={onStartSetup}
          >
            Пропустить
          </button>
          <button
            className="welcome-button-primary"
            onClick={handleCompleteSetup}
            disabled={selectedWidgets.size === 0}
          >
            <span>Начать работу</span>
            {selectedWidgets.size > 0 && (
              <span className="welcome-button-badge">{selectedWidgets.size}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
