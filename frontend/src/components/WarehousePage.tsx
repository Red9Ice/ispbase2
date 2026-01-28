/**
 * @file: WarehousePage.tsx
 * @description: Страница склада с вкладками, фильтрами и таблицей товаров.
 * @dependencies: services/api.ts, WarehouseCategorySidebar.tsx
 * @created: 2026-01-27
 */

import { useState, useMemo } from 'react';
import { WarehouseCategorySidebar } from './WarehouseCategorySidebar';
import { WarehouseSetsTab, type EquipmentSetDto } from './WarehouseSetsTab';
import { WarehouseCasesTab, type EquipmentCaseDto } from './WarehouseCasesTab';
import { WarehouseCategoriesTab } from './WarehouseCategoriesTab';
import type { EquipmentDto, EquipmentCategoryDto } from '../services/api';
import { formatDate } from '../utils/format';
import './WarehousePage.css';

type WarehouseTab = 'products' | 'sets' | 'cases' | 'categories';

interface WarehousePageProps {
  equipmentList: EquipmentDto[];
  equipmentCategories: EquipmentCategoryDto[];
  selectedCategoryId: number | null | undefined;
  onSelectCategory: (categoryId: number | null) => void;
  onViewEquipment: (id: number) => void;
  onEditEquipment: (equipment: EquipmentDto) => void;
  onCreateProduct: () => void;
  onCreateSet?: () => void;
  onEditSet?: (set: EquipmentSetDto) => void;
  onViewSet?: (id: number) => void;
  onCreateCase?: () => void;
  onEditCase?: (caseItem: EquipmentCaseDto) => void;
  onViewCase?: (id: number) => void;
  warehouseCases?: EquipmentCaseDto[];
  loading?: boolean;
}

export function WarehousePage({
  equipmentList,
  equipmentCategories,
  selectedCategoryId,
  onSelectCategory,
  onViewEquipment,
  onEditEquipment,
  onCreateProduct,
  onCreateSet,
  onEditSet,
  onViewSet,
  onCreateCase,
  onEditCase,
  onViewCase,
  warehouseCases,
  loading = false,
}: WarehousePageProps) {
  // Заглушка для наборов (пока нет API)
  const [sets] = useState<EquipmentSetDto[]>([
    {
      id: 1,
      name: 'Набор: SBN SUB',
      sku: 'SET-SBN-SUB-001',
      status: 'active',
      componentsCount: 5,
      inventoryCount: 10,
      warehouseCount: 8,
      discount: 10,
      shiftPrice: 50000,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Набор: Тата Star Classic (Green)(барабаны)',
      sku: 'SET-TATA-001',
      status: 'active',
      componentsCount: 8,
      inventoryCount: 3,
      warehouseCount: 2,
      discount: 0,
      shiftPrice: 861620,
      updatedAt: new Date().toISOString(),
    },
  ]);
  // Используем кейсы из пропсов или заглушку
  const cases = warehouseCases || [
    {
      id: 1,
      name: 'Кейс: Pelican 1510',
      sku: 'CASE-PEL-1510-001',
      status: 'active' as const,
      inventoryCount: 5,
      warehouseCount: 4,
      shiftPrice: 15000,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Кейс: SKB 3U Rack Case',
      sku: 'CASE-SKB-3U-001',
      status: 'active' as const,
      inventoryCount: 3,
      warehouseCount: 2,
      shiftPrice: 25000,
      updatedAt: new Date().toISOString(),
    },
  ];
  const [activeTab, setActiveTab] = useState<WarehouseTab>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('any');
  const [hideVariants, setHideVariants] = useState(false);
  const [hideArchived, setHideArchived] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Фильтрация оборудования
  const filteredEquipment = useMemo(() => {
    let filtered = [...equipmentList];

    // Фильтр по категории
    if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
      filtered = filtered.filter((item) => item.categoryId === selectedCategoryId);
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const searchText = `${item.name} ${item.model || ''} ${item.manufacturer || ''} ${item.serialNumber || ''}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    // Фильтр по статусу
    if (statusFilter !== 'any') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Скрыть архив
    if (hideArchived) {
      filtered = filtered.filter((item) => item.status !== 'retired');
    }

    return filtered;
  }, [equipmentList, selectedCategoryId, searchQuery, statusFilter, hideArchived]);

  // Пагинация
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredEquipment.slice(start, end);
  }, [filteredEquipment, currentPage, itemsPerPage]);

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
    if (selectedItems.size === paginatedEquipment.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedEquipment.map((item) => item.id!)));
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Активный',
      in_use: 'В использовании',
      maintenance: 'На обслуживании',
      retired: 'Архив',
    };
    return labels[status] || status;
  };

  // Заглушки для данных, которых пока нет в модели
  const getInventoryCount = (_item: EquipmentDto) => 1; // TODO: добавить в модель
  const getMaintenanceCount = (item: EquipmentDto) => item.status === 'maintenance' ? 1 : 0; // TODO: добавить в модель
  const getRentalCount = (item: EquipmentDto) => item.status === 'in_use' ? 1 : 0; // TODO: добавить в модель
  const getWarehouseCount = (item: EquipmentDto) => item.status === 'available' ? 1 : 0; // TODO: добавить в модель
  const getShiftPrice = (_item: EquipmentDto) => '0.00 ₽'; // TODO: добавить в модель

  return (
    <section className="warehouse-page">
      <WarehouseCategorySidebar
        categories={equipmentCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
      />
      <div className="warehouse-main">
        {/* Вкладки */}
        <div className="warehouse-tabs">
          <button
            className={`warehouse-tab ${activeTab === 'products' ? 'warehouse-tab-active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Продукты
          </button>
          <button
            className={`warehouse-tab ${activeTab === 'sets' ? 'warehouse-tab-active' : ''}`}
            onClick={() => setActiveTab('sets')}
          >
            Наборы
          </button>
          <button
            className={`warehouse-tab ${activeTab === 'cases' ? 'warehouse-tab-active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            Кейсы
          </button>
          <button
            className={`warehouse-tab ${activeTab === 'categories' ? 'warehouse-tab-active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Категории
          </button>
        </div>

        {activeTab === 'products' && (
          <>
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
                  <option value="available">Доступно</option>
                  <option value="in_use">В использовании</option>
                  <option value="maintenance">На обслуживании</option>
                  <option value="retired">Архив</option>
                </select>
              </div>
              <div className="warehouse-controls-right">
                <label className="warehouse-toggle">
                  <input
                    type="checkbox"
                    checked={hideVariants}
                    onChange={(e) => setHideVariants(e.target.checked)}
                  />
                  <span>Скрыть варианты</span>
                </label>
                <label className="warehouse-toggle">
                  <input
                    type="checkbox"
                    checked={hideArchived}
                    onChange={(e) => setHideArchived(e.target.checked)}
                  />
                  <span>Скрыть архив</span>
                </label>
                <button className="warehouse-button-secondary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Все фильтры
                </button>
                <button className="warehouse-button-primary" onClick={onCreateProduct}>
                  + Создать продукт
                </button>
              </div>
            </div>

            {/* Панель действий и сводки */}
            <div className="warehouse-summary">
              <div className="warehouse-summary-left">
                <span>Отображаются {paginatedEquipment.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredEquipment.length)} из {filteredEquipment.length}</span>
              </div>
              <div className="warehouse-summary-right">
                <button className="warehouse-button-secondary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M2 8l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Выгрузка
                </button>
                <label className="warehouse-checkbox">
                  <input type="checkbox" />
                  <span>Прайс-лист</span>
                </label>
                <label className="warehouse-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Инвентарный лист</span>
                </label>
              </div>
            </div>

            {/* Таблица товаров */}
            <div className="warehouse-table-container">
              {loading && filteredEquipment.length === 0 ? (
                <div className="empty-state">Загрузка оборудования...</div>
              ) : filteredEquipment.length === 0 ? (
                <div className="empty-state">Товары не найдены</div>
              ) : (
                <table className="warehouse-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedItems.size === paginatedEquipment.length && paginatedEquipment.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Изобр.</th>
                      <th>Наименование</th>
                      <th>Артикул</th>
                      <th>Статус</th>
                      <th>Инвентарь</th>
                      <th>Обслуживание</th>
                      <th>Аренда</th>
                      <th>На складе</th>
                      <th>Цена смены</th>
                      <th>Активность</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEquipment.map((item, index) => (
                      <tr
                        key={item.id !== null && item.id !== undefined ? `equipment-${item.id}` : `equipment-temp-${index}`}
                        data-equipment-id={item.id}
                        className="warehouse-table-row"
                        onClick={() => onViewEquipment(item.id!)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id!)}
                            onChange={() => handleSelectItem(item.id!)}
                          />
                        </td>
                        <td>
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.name} className="warehouse-item-image" />
                          ) : (
                            <div className="warehouse-item-image-placeholder">—</div>
                          )}
                        </td>
                        <td>{item.name}</td>
                        <td>{item.serialNumber || item.model || '—'}</td>
                        <td>
                          <span className={`tag ${item.status}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td>{getInventoryCount(item)}</td>
                        <td>{getMaintenanceCount(item)}</td>
                        <td>{getRentalCount(item)}</td>
                        <td>{getWarehouseCount(item)}</td>
                        <td>{getShiftPrice(item)}</td>
                        <td>{item.updatedAt ? formatDate(item.updatedAt) : '—'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="warehouse-action-button"
                            onClick={() => onEditEquipment(item)}
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
            {filteredEquipment.length > 0 && (
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
                  Отображаются {paginatedEquipment.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredEquipment.length)} из {filteredEquipment.length}
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
          </>
        )}

        {activeTab === 'sets' && (
          <WarehouseSetsTab
            sets={sets}
            onCreateSet={onCreateSet || (() => console.log('Create set'))}
            onEditSet={onEditSet || ((set) => console.log('Edit set', set))}
            onViewSet={onViewSet || ((id) => console.log('View set', id))}
            loading={loading}
          />
        )}

        {activeTab === 'cases' && (
          <WarehouseCasesTab
            cases={cases}
            onCreateCase={onCreateCase || (() => console.log('Create case'))}
            onEditCase={onEditCase || ((caseItem) => console.log('Edit case', caseItem))}
            onViewCase={onViewCase || ((id) => console.log('View case', id))}
            loading={loading}
          />
        )}

        {activeTab === 'categories' && (
          <WarehouseCategoriesTab
            onCreateCategory={onCreateProduct}
          />
        )}
      </div>
    </section>
  );
}
