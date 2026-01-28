/**
 * @file: StatsWidget.tsx
 * @description: Виджет статистики для dashboard
 * @created: 2026-01-27
 */

import { useMemo } from 'react';
import type { WidgetProps } from '../../types/widgets';
import './StatsWidget.css';

interface StatsWidgetProps extends WidgetProps {
  dashboardData?: {
    eventCounts: Record<string, number>;
    staffActive: number;
    staffInactive: number;
    contractPrice: number; // Цена контракта (было budgetPlanned)
    budgetActual: number;
    equipmentTotal: number;
    equipmentAvailable: number;
    equipmentInUse: number;
    equipmentMaintenance: number;
  };
  eventsCount?: number;
  staffCount?: number;
}

export function StatsWidget({ dashboardData, eventsCount = 0, staffCount = 0 }: StatsWidgetProps) {
  const stats = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        title: 'Событий в работе',
        value: dashboardData.eventCounts['in_work'] ?? 0,
        footer: `${dashboardData.eventCounts['request'] ?? 0} на согласовании`,
      },
      {
        title: 'Всего событий',
        value: eventsCount,
        footer: `${dashboardData.eventCounts['completed'] ?? 0} завершено`,
      },
      {
        title: 'Активный персонал',
        value: dashboardData.staffActive,
        footer: `${dashboardData.staffInactive} неактивных`,
      },
      {
        title: 'Всего персонала',
        value: staffCount,
        footer: `${dashboardData.staffActive} активных`,
      },
      {
        title: 'Бюджет (план)',
        value: `${((dashboardData.contractPrice || 0) / 1000000).toFixed(1)}M ₽`,
        footer: `${eventsCount} событий`,
      },
      {
        title: 'Бюджет (факт)',
        value: `${(dashboardData.budgetActual / 1000000).toFixed(1)}M ₽`,
        footer: eventsCount > 0 ? (
          <span className={dashboardData.budgetActual > (dashboardData.contractPrice || 0) ? 'text-warning' : 'text-success'}>
            {dashboardData.contractPrice ? (((dashboardData.budgetActual / (dashboardData.contractPrice || 1) - 1) * 100).toFixed(1)) : '0'}% от плана
          </span>
        ) : null,
      },
      {
        title: 'Всего оборудования',
        value: dashboardData.equipmentTotal,
        footer: `${dashboardData.equipmentAvailable} доступно`,
      },
      {
        title: 'Оборудование в работе',
        value: dashboardData.equipmentInUse,
        footer: `${dashboardData.equipmentMaintenance} на обслуживании`,
      },
    ];
  }, [dashboardData, eventsCount, staffCount]);

  return (
    <div className="stats-widget">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="stat-title">{stat.title}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-footer">
              {typeof stat.footer === 'string' ? stat.footer : stat.footer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
