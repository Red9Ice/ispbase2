/**
 * @file: StaffPage.tsx
 * @description: Страница персонала с подстраницами "имлайт" и "фриланс"
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import type { StaffDto } from '../services/api';
import './StaffPage.css';

type StaffTab = 'imlight' | 'freelance';

interface StaffPageProps {
  staffList: StaffDto[];
  loading: boolean;
  onViewStaff: (id: number) => void;
  onEditStaff: (staff: StaffDto) => void;
}

export function StaffPage({
  staffList,
  loading,
  onViewStaff,
  onEditStaff,
}: StaffPageProps) {
  const [activeTab, setActiveTab] = useState<StaffTab>('imlight');

  // Фильтрация персонала по типу (пока что обе вкладки показывают всех)
  // В будущем можно добавить поле type в StaffDto для разделения
  const filteredStaff = useMemo(() => {
    // TODO: Добавить фильтрацию по типу персонала (imlight/freelance)
    // когда будет добавлено соответствующее поле в модель
    return staffList;
  }, [staffList]);

  return (
    <section className="events-page">
      <div className="panel">
        {/* Вкладки */}
        <div className="staff-tabs">
          <button
            className={`staff-tab ${activeTab === 'imlight' ? 'staff-tab-active' : ''}`}
            onClick={() => setActiveTab('imlight')}
          >
            Имлайт
          </button>
          <button
            className={`staff-tab ${activeTab === 'freelance' ? 'staff-tab-active' : ''}`}
            onClick={() => setActiveTab('freelance')}
          >
            Фриланс
          </button>
        </div>

        {loading && filteredStaff.length === 0 ? (
          <div className="panel-body">
            <div className="empty-state">Загрузка сотрудников...</div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="panel-body">
            <div className="empty-state">Сотрудники не найдены</div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Фамилия</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Статус</th>
                    <th>Ставка</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((person) => (
                    <tr
                      key={person.id}
                      data-staff-id={person.id}
                      className="table-row-clickable"
                      onClick={() => onViewStaff(person.id!)}
                    >
                      <td>
                        {person.firstName} {person.middleName || ''}
                      </td>
                      <td>{person.lastName}</td>
                      <td>{person.email}</td>
                      <td>{person.phone || '-'}</td>
                      <td>
                        <span className={`tag ${person.status}`}>
                          {person.status === 'active' ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td>
                        {person.rate
                          ? `${person.rate.toLocaleString('ru-RU')} ${person.currency}`
                          : '-'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="button-link"
                          onClick={() => onEditStaff(person)}
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-mobile">
              {filteredStaff.map((person) => (
                <div
                  key={person.id}
                  data-staff-id={person.id}
                  className="table-mobile-card"
                  onClick={() => onViewStaff(person.id!)}
                >
                  <div className="table-mobile-row">
                    <div className="table-mobile-label">Имя</div>
                    <div className="table-mobile-value">
                      {person.firstName} {person.middleName || ''}
                    </div>
                  </div>
                  <div className="table-mobile-row">
                    <div className="table-mobile-label">Фамилия</div>
                    <div className="table-mobile-value">{person.lastName}</div>
                  </div>
                  <div className="table-mobile-row">
                    <div className="table-mobile-label">Email</div>
                    <div className="table-mobile-value">{person.email}</div>
                  </div>
                  <div className="table-mobile-row">
                    <div className="table-mobile-label">Телефон</div>
                    <div className="table-mobile-value">{person.phone || '-'}</div>
                  </div>
                  <div className="table-mobile-row">
                    <div className="table-mobile-label">Статус</div>
                    <div className="table-mobile-value">
                      <span className={`tag ${person.status}`}>
                        {person.status === 'active' ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                  </div>
                  <div className="table-mobile-row">
                    <div className="table-mobile-label">Ставка</div>
                    <div className="table-mobile-value">
                      {person.rate
                        ? `${person.rate.toLocaleString('ru-RU')} ${person.currency}`
                        : '-'}
                    </div>
                  </div>
                  <div
                    className="table-mobile-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="button-secondary"
                      onClick={() => onEditStaff(person)}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
