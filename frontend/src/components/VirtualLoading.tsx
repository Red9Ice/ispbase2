/**
 * @file: VirtualLoading.tsx
 * @description: Компонент для виртуальной погрузки грузовой машины кейсами со склада.
 * @dependencies: none
 * @created: 2026-01-27
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import './VirtualLoading.css';
import { TrailerScene3D } from './TrailerScene3D';
import type { EquipmentCaseDto } from './WarehouseCasesTab';

export interface Crate {
  id: string;
  name: string;
  length: number; // см
  width: number; // см
  height: number; // см
  weightGross: number; // кг (брутто)
  weightNet: number; // кг (нетто)
  quantity: number; // количество кейсов
}

export interface PlacedCrate extends Crate {
  x: number; // позиция в прицепе (см)
  y: number;
  z: number;
  rotation?: 0 | 90 | 180 | 270; // поворот в градусах
}

// Размеры стандартного прицепа (в см)
const TRAILER_DIMENSIONS = {
  length: 1360, // ~13.6 м
  width: 245, // ~2.45 м
  height: 270, // ~2.7 м
};

// Максимальная грузоподъемность (кг)
const MAX_WEIGHT = 20000; // 20 тонн

type ViewMode = 'top' | 'side' | 'front' | 'free';

interface VirtualLoadingProps {
  warehouseCases?: EquipmentCaseDto[];
}

// Стандартные размеры для разных типов кейсов (в см)
const DEFAULT_CASE_DIMENSIONS: Record<string, { length: number; width: number; height: number; weightGross: number; weightNet: number }> = {
  'Pelican 1510': { length: 56, width: 43, height: 23, weightGross: 8, weightNet: 6 },
  'SKB 3U Rack Case': { length: 48, width: 48, height: 13, weightGross: 12, weightNet: 10 },
  'default': { length: 50, width: 40, height: 30, weightGross: 10, weightNet: 8 },
};

export function VirtualLoading({ warehouseCases = [] }: VirtualLoadingProps) {
  const [crates, setCrates] = useState<Crate[]>([]);
  const [placedCrates, setPlacedCrates] = useState<PlacedCrate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('top');
  const [freeRotation, setFreeRotation] = useState({ x: -30, y: 45 }); // углы вращения для свободного вида
  const [zoom, setZoom] = useState(1); // масштаб сцены (колёсико мыши)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [newCrate, setNewCrate] = useState<Omit<Crate, 'id'>>({
    name: '',
    length: 0,
    width: 0,
    height: 0,
    weightGross: 0,
    weightNet: 0,
    quantity: 1,
  });

  // Статистика погрузки
  const loadingStats = useMemo(() => {
    const totalWeight = placedCrates.reduce((sum, crate) => sum + crate.weightGross, 0);
    const totalVolume = placedCrates.reduce((sum, crate) => sum + crate.length * crate.width * crate.height, 0);
    const maxVolume = TRAILER_DIMENSIONS.length * TRAILER_DIMENSIONS.width * TRAILER_DIMENSIONS.height;
    const volumeUtilization = (totalVolume / maxVolume) * 100;
    const weightUtilization = (totalWeight / MAX_WEIGHT) * 100;
    const totalCratesQuantity = crates.reduce((sum, crate) => sum + crate.quantity, 0);

    return {
      totalWeight,
      totalVolume,
      maxVolume,
      volumeUtilization,
      weightUtilization,
      crateCount: placedCrates.length,
      totalCratesQuantity,
    };
  }, [placedCrates, crates]);

  // Алгоритм размещения кейсов (упрощенный First Fit Decreasing)
  const packCrates = useCallback(() => {
    if (crates.length === 0) {
      setPlacedCrates([]);
      return;
    }

    // Сортируем кейсы по объему (убывание)
    const sortedCrates = [...crates].sort((a, b) => {
      const volumeA = a.length * a.width * a.height;
      const volumeB = b.length * b.width * b.height;
      return volumeB - volumeA;
    });

    const placed: PlacedCrate[] = [];
    const occupied: Array<{ x: number; y: number; z: number; length: number; width: number; height: number }> = [];

    // Создаем расширенный список кейсов с учетом quantity
    const expandedCrates: Crate[] = [];
    for (const crate of sortedCrates) {
      for (let i = 0; i < crate.quantity; i++) {
        expandedCrates.push(crate);
      }
    }

    // Сортируем расширенный список по объему
    expandedCrates.sort((a, b) => {
      const volumeA = a.length * a.width * a.height;
      const volumeB = b.length * b.width * b.height;
      return volumeB - volumeA;
    });

    for (const crate of expandedCrates) {
      let placedCrate: PlacedCrate | null = null;

      // Пробуем разместить кейс в разных ориентациях
      const orientations = [
        { length: crate.length, width: crate.width, height: crate.height },
        { length: crate.width, width: crate.length, height: crate.height },
        { length: crate.length, width: crate.height, height: crate.width },
        { length: crate.width, width: crate.height, height: crate.length },
        { length: crate.height, width: crate.length, height: crate.width },
        { length: crate.height, width: crate.width, height: crate.length },
      ];

      for (let orientIdx = 0; orientIdx < orientations.length; orientIdx++) {
        const orient = orientations[orientIdx];
        const rotation = orientIdx === 0 ? 0 : orientIdx === 1 ? 90 : orientIdx === 2 ? 180 : 270;

        // Проверяем, помещается ли кейс по размерам
        if (
          orient.length > TRAILER_DIMENSIONS.length ||
          orient.width > TRAILER_DIMENSIONS.width ||
          orient.height > TRAILER_DIMENSIONS.height
        ) {
          continue;
        }

        // Ищем место для размещения
        let found = false;
        let bestX = 0;
        let bestY = 0;
        let bestZ = 0;

        // Пробуем разместить снизу вверх, слева направо, спереди назад
        for (let z = 0; z <= TRAILER_DIMENSIONS.height - orient.height && !found; z += 10) {
          for (let y = 0; y <= TRAILER_DIMENSIONS.width - orient.width && !found; y += 10) {
            for (let x = 0; x <= TRAILER_DIMENSIONS.length - orient.length && !found; x += 10) {
              // Проверяем пересечение с уже размещенными кейсами
              const intersects = occupied.some((occ) => {
                return !(
                  x + orient.length <= occ.x ||
                  occ.x + occ.length <= x ||
                  y + orient.width <= occ.y ||
                  occ.y + occ.width <= y ||
                  z + orient.height <= occ.z ||
                  occ.z + occ.height <= z
                );
              });

              if (!intersects) {
                bestX = x;
                bestY = y;
                bestZ = z;
                found = true;
              }
            }
          }
        }

        if (found) {
          placedCrate = {
            ...crate,
            x: bestX,
            y: bestY,
            z: bestZ,
            length: orient.length,
            width: orient.width,
            height: orient.height,
            rotation,
          };
          break;
        }
      }

      if (placedCrate) {
        placed.push(placedCrate);
        occupied.push({
          x: placedCrate.x,
          y: placedCrate.y,
          z: placedCrate.z,
          length: placedCrate.length,
          width: placedCrate.width,
          height: placedCrate.height,
        });
      }
    }

    setPlacedCrates(placed);
  }, [crates]);

  const handleAddCrate = () => {
    if (!newCrate.name || newCrate.length <= 0 || newCrate.width <= 0 || newCrate.height <= 0 || newCrate.quantity < 1) {
      alert('Заполните все обязательные поля');
      return;
    }

    const crate: Crate = {
      id: `crate-${Date.now()}`,
      ...newCrate,
    };

    setCrates([...crates, crate]);
    setNewCrate({
      name: '',
      length: 0,
      width: 0,
      height: 0,
      weightGross: 0,
      weightNet: 0,
      quantity: 1,
    });
    setShowAddForm(false);
  };

  const handleRemoveCrate = (id: string) => {
    setCrates(crates.filter((c) => c.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }
    setCrates(crates.map((c) => (c.id === id ? { ...c, quantity: newQuantity } : c)));
  };

  const handleIncrementQuantity = (id: string) => {
    setCrates(crates.map((c) => (c.id === id ? { ...c, quantity: c.quantity + 1 } : c)));
  };

  const handleDecrementQuantity = (id: string) => {
    setCrates(crates.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c)));
  };

  const handleReload = () => {
    packCrates();
  };

  // Обработчики для вращения в свободном режиме
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'free') {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && viewMode === 'free') {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setFreeRotation((prev) => ({
        x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
        y: prev.y + deltaX * 0.5,
      }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, viewMode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.4, Math.min(3, z + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Вычисление углов поворота в зависимости от режима просмотра
  const viewRotation = useMemo(() => {
    switch (viewMode) {
      case 'top':
        return { x: -90, y: 0 };
      case 'side':
        return { x: 0, y: 90 };
      case 'front':
        return { x: 0, y: 0 };
      case 'free':
        return freeRotation;
      default:
        return { x: -30, y: 45 };
    }
  }, [viewMode, freeRotation]);

  // Определение максимального количества этажей
  const maxFloors = useMemo(() => {
    if (placedCrates.length === 0) return 1;
    const floors = new Set<number>();
    placedCrates.forEach(crate => {
      // Определяем этаж на основе нижней грани кейса (z координата)
      const floor = Math.floor(crate.z / 50) + 1; // этаж высотой примерно 50 см
      floors.add(floor);
    });
    return floors.size > 0 ? Math.max(...Array.from(floors)) : 1;
  }, [placedCrates]);

  // Автоматически размещаем кейсы при изменении списка
  useEffect(() => {
    packCrates();
  }, [packCrates]);

  return (
    <div className="virtual-loading">
      <div className="virtual-loading-header">
        <h2 style={{ display: 'none' }}>Виртуальная погрузка</h2>
        <div className="virtual-loading-actions">
          <button className="primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Отменить' : 'Добавить кейс'}
          </button>
          <button className="button-secondary" onClick={handleReload} disabled={crates.length === 0}>
            Погрузить заново
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="panel" style={{ marginBottom: '20px' }}>
          <div className="panel-header">Добавить кейс</div>
          <div className="panel-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Название кейса</label>
                <input
                  type="text"
                  value={newCrate.name}
                  onChange={(e) => setNewCrate({ ...newCrate, name: e.target.value })}
                  placeholder="Например: Кейс со светом #1"
                />
              </div>
              <div className="form-group">
                <label>Длина (см)</label>
                <input
                  type="number"
                  value={newCrate.length || ''}
                  onChange={(e) => setNewCrate({ ...newCrate, length: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Ширина (см)</label>
                <input
                  type="number"
                  value={newCrate.width || ''}
                  onChange={(e) => setNewCrate({ ...newCrate, width: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Высота (см)</label>
                <input
                  type="number"
                  value={newCrate.height || ''}
                  onChange={(e) => setNewCrate({ ...newCrate, height: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Вес брутто (кг)</label>
                <input
                  type="number"
                  value={newCrate.weightGross || ''}
                  onChange={(e) => setNewCrate({ ...newCrate, weightGross: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Вес нетто (кг)</label>
                <input
                  type="number"
                  value={newCrate.weightNet || ''}
                  onChange={(e) => setNewCrate({ ...newCrate, weightNet: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Количество</label>
                <input
                  type="number"
                  value={newCrate.quantity || ''}
                  onChange={(e) => setNewCrate({ ...newCrate, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  step="1"
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="primary" onClick={handleAddCrate}>
                Добавить
              </button>
              <button className="button-secondary" onClick={() => setShowAddForm(false)}>
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="virtual-loading-content">
        <div className="virtual-loading-sidebar">
          {/* Доступные кейсы со склада */}
          {warehouseCases.length > 0 && (
            <div className="panel" style={{ marginBottom: '20px' }}>
              <div className="panel-header">
                Кейсы на складе <span className="panel-header-count">({warehouseCases.length})</span>
              </div>
              <div className="panel-body">
                <div className="warehouse-cases-list">
                  {warehouseCases
                    .filter((c) => c.status === 'active' && c.warehouseCount > 0)
                    .map((warehouseCase) => {
                      const caseName = warehouseCase.name.replace('Кейс: ', '');
                      const defaultDims = DEFAULT_CASE_DIMENSIONS[caseName] || DEFAULT_CASE_DIMENSIONS['default'];
                      return (
                        <div key={warehouseCase.id} className="warehouse-case-item">
                          <div className="warehouse-case-header">
                            <strong>{warehouseCase.name}</strong>
                            {warehouseCase.sku && <span className="warehouse-case-sku">{warehouseCase.sku}</span>}
                          </div>
                          <div className="warehouse-case-details">
                            <div>На складе: {warehouseCase.warehouseCount} шт.</div>
                            <div>Цена смены: {warehouseCase.shiftPrice.toLocaleString('ru-RU')} ₽</div>
                          </div>
                          <button
                            className="button-secondary"
                            style={{ width: '100%', marginTop: '8px' }}
                            onClick={() => {
                              const newCrate: Crate = {
                                id: `warehouse-${warehouseCase.id}-${Date.now()}`,
                                name: warehouseCase.name,
                                length: defaultDims.length,
                                width: defaultDims.width,
                                height: defaultDims.height,
                                weightGross: defaultDims.weightGross,
                                weightNet: defaultDims.weightNet,
                                quantity: 1,
                              };
                              setCrates([...crates, newCrate]);
                            }}
                          >
                            Добавить в погрузку
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Кейсы в погрузке */}
          <div className="panel">
            <div className="panel-header">
              Кейсы в погрузке {loadingStats.totalCratesQuantity > 0 && <span className="panel-header-count">({loadingStats.totalCratesQuantity})</span>}
            </div>
            <div className="panel-body">
              {crates.length === 0 ? (
                <div className="empty-state">Нет кейсов</div>
              ) : (
                <div className="crates-list">
                  {crates.map((crate) => (
                    <div key={crate.id} className="crate-item">
                      <div className="crate-item-header">
                        <strong>{crate.name}</strong>
                        <button
                          className="button-link"
                          onClick={() => handleRemoveCrate(crate.id)}
                          style={{ color: 'var(--text-danger)' }}
                        >
                          Удалить
                        </button>
                      </div>
                      <div className="crate-item-details">
                        <div>Размеры: {crate.length} × {crate.width} × {crate.height} см</div>
                        <div>Вес: {crate.weightGross} кг (брутто) / {crate.weightNet} кг (нетто)</div>
                        <div>Объем: {(crate.length * crate.width * crate.height / 1000000).toFixed(2)} м³</div>
                      </div>
                      <div className="crate-item-quantity">
                        <label>Количество:</label>
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleDecrementQuantity(crate.id)}
                            disabled={crate.quantity <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="quantity-input"
                            value={crate.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              handleUpdateQuantity(crate.id, Math.max(1, value));
                            }}
                            min="1"
                            step="1"
                          />
                          <button
                            className="quantity-btn"
                            onClick={() => handleIncrementQuantity(crate.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{ marginTop: '20px' }}>
            <div className="panel-header">Статистика погрузки</div>
            <div className="panel-body">
              <div className="loading-stats">
                <div className="stat-item">
                  <div className="stat-label">Кейсов погружено</div>
                  <div className="stat-value">{loadingStats.crateCount} / {loadingStats.totalCratesQuantity}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Общий вес</div>
                  <div className="stat-value">{loadingStats.totalWeight.toFixed(1)} кг</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Использование веса</div>
                  <div className="stat-value">{loadingStats.weightUtilization.toFixed(1)}%</div>
                  <div className="stat-progress">
                    <div
                      className="stat-progress-bar"
                      style={{
                        width: `${Math.min(loadingStats.weightUtilization, 100)}%`,
                        backgroundColor: loadingStats.weightUtilization > 90 ? 'var(--color-danger)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Использование объема</div>
                  <div className="stat-value">{loadingStats.volumeUtilization.toFixed(1)}%</div>
                  <div className="stat-progress">
                    <div
                      className="stat-progress-bar"
                      style={{
                        width: `${Math.min(loadingStats.volumeUtilization, 100)}%`,
                        backgroundColor: loadingStats.volumeUtilization > 90 ? 'var(--color-danger)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="virtual-loading-visualization">
          <div className="panel">
            <div className="panel-header">
              <div>Вид прицепа</div>
              <div className="view-mode-selector">
                <button
                  className={viewMode === 'top' ? 'view-btn active' : 'view-btn'}
                  onClick={() => setViewMode('top')}
                  title="Вид сверху"
                >
                  Сверху
                </button>
                <button
                  className={viewMode === 'side' ? 'view-btn active' : 'view-btn'}
                  onClick={() => setViewMode('side')}
                  title="Вид сбоку"
                >
                  Сбоку
                </button>
                <button
                  className={viewMode === 'front' ? 'view-btn active' : 'view-btn'}
                  onClick={() => setViewMode('front')}
                  title="Вид спереди"
                >
                  Спереди
                </button>
                <button
                  className={viewMode === 'free' ? 'view-btn active' : 'view-btn'}
                  onClick={() => setViewMode('free')}
                  title="Свободный 3D вид (вращайте мышью)"
                >
                  3D
                </button>
              </div>
            </div>
            <div className="panel-body">
              <div className="trailer-container-3d">
                <div
                  ref={containerRef}
                  className="trailer-3d-wrapper"
                  onMouseDown={handleMouseDown}
                  style={{
                    cursor: viewMode === 'free' ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  }}
                  role="img"
                  aria-label="3D вид прицепа"
                >
                  <TrailerScene3D
                    viewRotation={viewRotation}
                    zoom={zoom}
                    placedCrates={placedCrates}
                  />
                </div>
                <div className="trailer-info">
                  <div>Размеры прицепа: {TRAILER_DIMENSIONS.length / 100}м × {TRAILER_DIMENSIONS.width / 100}м × {TRAILER_DIMENSIONS.height / 100}м</div>
                  <div>Максимальная грузоподъемность: {MAX_WEIGHT / 1000} тонн</div>
                  {maxFloors > 1 && (
                    <div className="floors-info">Этажей: {maxFloors}</div>
                  )}
                  {viewMode === 'free' && (
                    <div className="view-hint">💡 Зажмите ЛКМ и двигайте — вращение; колёсико мыши — масштаб</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
