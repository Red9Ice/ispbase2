/**
 * @file: ActiveStaffWidget.tsx
 * @description: Виджет активного персонала
 * @created: 2026-01-27
 */

import type { WidgetProps } from '../../types/widgets';
import type { StaffDto } from '../../services/api';
import './ActiveStaffWidget.css';

interface ActiveStaffWidgetProps extends WidgetProps {
  staff?: StaffDto[];
  onStaffClick?: (staffId: number) => void;
}

export function ActiveStaffWidget({ staff = [], onStaffClick }: ActiveStaffWidgetProps) {
  if (staff.length === 0) {
    return (
      <div className="active-staff-widget">
        <div className="empty-state">Нет персонала</div>
      </div>
    );
  }

  return (
    <div className="active-staff-widget">
      <div className="staff-list">
        {staff.map((person) => (
          <div
            key={person.id}
            className="staff-item"
            onClick={() => person.id && onStaffClick?.(person.id)}
          >
            <div className="staff-name">
              {person.lastName} {person.firstName} {person.middleName ?? ''}
            </div>
            <div className="staff-meta">
              <span className="staff-email">{person.email}</span>
              <span className={`staff-status tag ${person.status}`}>
                {person.status === 'active' ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            {person.rate && (
              <div className="staff-rate">
                {person.rate.toLocaleString('ru-RU')} ₽/час
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
