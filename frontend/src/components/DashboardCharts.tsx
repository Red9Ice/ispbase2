/**
 * @file: DashboardCharts.tsx
 * @description: Компоненты графиков для dashboard
 * @dependencies: recharts
 * @created: 2026-01-26
 */

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardCharts.css';

// Семантически правильные цвета для статусов событий
// Используем цвета, которые хорошо видны как на светлой, так и на темной теме
const getStatusColors = (): Record<string, string> => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    return {
      'Черновик': '#64748b',      // Серый (темная тема)
      'Запрос': '#f59e0b',        // Желтый (темная тема)
      'В работе': '#2563eb',      // Синий (темная тема)
      'Завершено': '#059669',     // Зеленый (темная тема)
      'Отменено': '#dc2626',      // Красный (темная тема)
    };
  }
  return {
    'Черновик': '#94a3b8',        // Серый (светлая тема)
    'Запрос': '#fbbf24',          // Желтый (светлая тема)
    'В работе': '#3b82f6',        // Синий (светлая тема)
    'Завершено': '#10b981',       // Зеленый (светлая тема)
    'Отменено': '#ef4444',        // Красный (светлая тема)
  };
};

// Цвета для графика загрузки персонала (оранжевая палитра)
const UTILIZATION_COLORS = ['#FF8C00', '#FFA500', '#FF7A00', '#E67E00', '#FFB84D'];

function formatBudgetYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

function formatBudgetTooltip(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

interface EventsByStatusData {
  name: string;
  value: number;
}

interface BudgetTrendData {
  month: string;
  planned: number;
  actual: number;
}

interface StaffUtilizationData {
  name: string;
  utilization: number;
}

interface DashboardChartsProps {
  eventsByStatus: EventsByStatusData[];
  budgetTrend: BudgetTrendData[];
  staffUtilization: StaffUtilizationData[];
}

export function EventsByStatusChart({ data }: { data: EventsByStatusData[] }) {
  const statusColors = getStatusColors();
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Мероприятия по статусам</h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={statusColors[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetTrendChart({ data }: { data: BudgetTrendData[] }) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Динамика бюджета</h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="month" 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickFormatter={formatBudgetYAxis}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number | undefined) => formatBudgetTooltip(value ?? 0)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="planned"
            stroke="#FF8C00"
            strokeWidth={2}
            name="Планируемый"
            dot={{ fill: '#FF8C00', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#4CAF50"
            strokeWidth={2}
            name="Фактический"
            dot={{ fill: '#4CAF50', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StaffUtilizationChart({ data }: { data: StaffUtilizationData[] }) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Загрузка персонала</h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            width={50}
            domain={[0, 100]}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Загрузка']}
          />
          <Bar dataKey="utilization" fill="#FF8C00" radius={[8, 8, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={`staff-cell-${item.name || index}-${index}`} fill={UTILIZATION_COLORS[index % UTILIZATION_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardCharts({ eventsByStatus, budgetTrend, staffUtilization }: DashboardChartsProps) {
  return (
    <div className="charts-grid">
      <EventsByStatusChart data={eventsByStatus} />
      <BudgetTrendChart data={budgetTrend} />
      <StaffUtilizationChart data={staffUtilization} />
    </div>
  );
}
