/**
 * @file: WarehouseSetsTab.tsx
 * @description: Вкладка "Наборы" с таблицей, фильтрами и функционалом управления наборами.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import { formatDate } from '../utils/format';
import './WarehouseSetsTab.css';

export interface EquipmentSetDto {
  id?: number;
  name: string;
  sku?: string;
  photoUrl?: string;
  status: 'active' | 'inactive' | 'archived';
  componentsCount: number;
  inventoryCount: number;
  warehouseCount: number;
  discount?: number;
  shiftPrice: number;
  updatedAt?: string;
}

interface WarehouseSetsTabProps {
  sets: EquipmentSetDto[];
  onCreateSet: () => void;
  onEditSet: (set: EquipmentSetDto) => void;
  onViewSet: (id: number) => void;
  loading?: boolean;
}

export function WarehouseSetsTab({
  sets,
  onCreateSet,
  onEditSet,
  onViewSet,
  loading = false,
}: WarehouseSetsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('any');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [hideArchived, setHideArchived] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Вычисление активных фильтров
  useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== 'any') count++;
    if (priceRange[0] > 0 || priceRange[1] < 1000000) count++;
    setActiveFiltersCount(count);
  }, [searchQuery, statusFilter, priceRange]);

  // Фильтрация наборов
  const filteredSets = useMemo(() => {
    let filtered = [...sets];

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const searchText = `${item.name} ${item.sku || ''}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    // Фильтр по статусу
    if (statusFilter !== 'any') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Фильтр по цене
    filtered = filtered.filter((item) => {
      return item.shiftPrice >= priceRange[0] && item.shiftPrice <= priceRange[1];
    });

    // Скрыть архив
    if (hideArchived) {
      filtered = filtered.filter((item) => item.status !== 'archived');
    }

    return filtered;
  }, [sets, searchQuery, statusFilter, priceRange, hideArchived]);

  // Пагинация
  const totalPages = Math.ceil(filteredSets.length / itemsPerPage);
  const paginatedSets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredSets.slice(start, end);
  }, [filteredSets, currentPage, itemsPerPage]);

  const handleSelectItem = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedSets.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedSets.map((item) => item.id!)));
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Активный',
      inactive: 'Неактивный',
      archived: 'Архив',
    };
    return labels[status] || status;
  };

  const handleExport = () => {
    // TODO: реализовать выгрузку
    console.log('Export sets');
  };

  const handlePriceList = () => {
    // TODO: реализовать прайс-лист
    console.log('Price list');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('any');
    setPriceRange([0, 1000000]);
    setHideArchived(true);
  };

  // Вычисление максимальной цены для слайдера
  const maxPrice = useMemo(() => {
    if (sets.length === 0) return 1000000;
    return Math.max(...sets.map((s) => s.shiftPrice), 1000000);
  }, [sets]);

  return (
    <div className="warehouse-sets-tab">
      {/* Панель управления и фильтрации */}
      <div className="warehouse-controls">
        <div className="warehouse-controls-left">
          <div className="warehouse-search">
            <svg className="warehouse-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zm0-9a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="currentColor"/>
              <path d="M11.293 11.293l2.354 2.354a.5.5 0 0 1-.708.708l-2.354-2.354a.5.5 0 0 1 .708-.708z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="warehouse-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="warehouse-select"
          >
            <option value="any">Любой</option>
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
            <option value="archived">Архив</option>
          </select>
          <div className="warehouse-price-range">
            <span className="warehouse-price-range-label">Цена смены:</span>
            <div className="warehouse-price-range-inputs">
              <input
                type="number"
                min="0"
                max={maxPrice}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="warehouse-price-input"
              />
              <span> - </span>
              <input
                type="number"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="warehouse-price-input"
              />
              <span> ₽</span>
            </div>
          </div>
        </div>
        <div className="warehouse-controls-right">
          <label className="warehouse-toggle">
            <input
              type="checkbox"
              checked={hideArchived}
              onChange={(e) => setHideArchived(e.target.checked)}
            />
            <span>Скрыть архив</span>
          </label>
          <button
            className="warehouse-button-secondary"
            onClick={() => setShowAllFilters(!showAllFilters)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Все фильтры
          </button>
          {activeFiltersCount > 0 && (
            <button
              className="warehouse-button-filter-active"
              onClick={handleResetFilters}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {activeFiltersCount} фильтра
            </button>
          )}
          <button className="warehouse-button-primary" onClick={onCreateSet}>
            + Создать набор
          </button>
        </div>
      </div>

      {/* Панель действий и сводки */}
      <div className="warehouse-summary">
        <div className="warehouse-summary-left">
          <span>Отображаются {paginatedSets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredSets.length)} из {filteredSets.length}</span>
        </div>
        <div className="warehouse-summary-right">
          <button className="warehouse-button-secondary" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Выгрузка
          </button>
          <button className="warehouse-button-secondary" onClick={handlePriceList}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 2h8v12H4V2zM6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Прайс-лист
          </button>
          <button className="warehouse-button-icon" title="Редактировать">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L4.5 13.5H2.5v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Таблица наборов */}
      <div className="warehouse-table-container">
        {loading && filteredSets.length === 0 ? (
          <div className="empty-state">Загрузка наборов...</div>
        ) : filteredSets.length === 0 ? (
          <div className="empty-state">Наборы не найдены</div>
        ) : (
          <table className="warehouse-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === paginatedSets.length && paginatedSets.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v2M8 10v2M2 8h2M10 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </th>
                <th>Изобр.</th>
                <th>Наименование</th>
                <th>Артикул</th>
                <th>Компоненты</th>
                <th>Статус</th>
                <th>Инвентарь</th>
                <th>На складе</th>
                <th>Скидка</th>
                <th>Цена смены</th>
                <th>Активность</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedSets.map((item) => (
                <tr
                  key={item.id}
                  className="warehouse-table-row"
                  onClick={() => onViewSet(item.id!)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id!)}
                      onChange={() => handleSelectItem(item.id!)}
                    />
                  </td>
                  <td>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v2M8 10v2M2 8h2M10 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </td>
                  <td>
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={item.name} className="warehouse-item-image" />
                    ) : (
                      <div className="warehouse-item-image-placeholder">—</div>
                    )}
                  </td>
                  <td>{item.name}</td>
                  <td>{item.sku || '—'}</td>
                  <td>{item.componentsCount}</td>
                  <td>
                    <span className={`tag ${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>{item.inventoryCount}</td>
                  <td>{item.warehouseCount}</td>
                  <td>{item.discount ? `${item.discount}%` : '—'}</td>
                  <td>{item.shiftPrice.toLocaleString('ru-RU')} ₽</td>
                  <td>{item.updatedAt ? formatDate(item.updatedAt) : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="warehouse-action-button"
                      onClick={() => onEditSet(item)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="3" r="1" fill="currentColor"/>
                        <circle cx="8" cy="8" r="1" fill="currentColor"/>
                        <circle cx="8" cy="13" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация */}
      {filteredSets.length > 0 && (
        <div className="warehouse-pagination">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="warehouse-pagination-select"
          >
            <option value="20">Показать 20 записей</option>
            <option value="50">Показать 50 записей</option>
            <option value="100">Показать 100 записей</option>
          </select>
          <span className="warehouse-pagination-info">
            Отображаются {paginatedSets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredSets.length)} из {filteredSets.length}
          </span>
          <div className="warehouse-pagination-controls">
            <button
              className="warehouse-pagination-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`warehouse-pagination-button ${currentPage === pageNum ? 'warehouse-pagination-button-active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="warehouse-pagination-ellipsis">...</span>
                <button
                  className="warehouse-pagination-button"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              className="warehouse-pagination-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
