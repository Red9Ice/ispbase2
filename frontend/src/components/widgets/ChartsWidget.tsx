/**
 * @file: ChartsWidget.tsx
 * @description: Виджет графиков для dashboard
 * @created: 2026-01-27
 */

import type { WidgetProps } from '../../types/widgets';
import { DashboardCharts } from '../DashboardCharts';
import './ChartsWidget.css';

interface ChartsWidgetProps extends WidgetProps {
  eventsByStatus?: Array<{ name: string; value: number }>;
  budgetTrend?: Array<{ month: string; planned: number; actual: number }>;
  staffUtilization?: Array<{ name: string; utilization: number }>;
}

export function ChartsWidget({ 
  eventsByStatus = [],
  budgetTrend = [],
  staffUtilization = []
}: ChartsWidgetProps) {
  return (
    <div className="charts-widget">
      <DashboardCharts
        eventsByStatus={eventsByStatus}
        budgetTrend={budgetTrend}
        staffUtilization={staffUtilization}
      />
    </div>
  );
}
