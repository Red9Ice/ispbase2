/**
 * @file: minimizedModals.ts
 * @description: Utility for managing positions of minimized modals to prevent overlapping.
 * @dependencies: none
 * @created: 2026-01-27
 */

interface MinimizedModal {
  id: string;
  position: number; // Индекс позиции (0, 1, 2, ...)
}

const minimizedModals = new Map<string, MinimizedModal>();

const MINIMIZED_HEIGHT = 60;
const MINIMIZED_SPACING = 10; // Отступ между свернутыми окнами
const MINIMIZED_START_X = 20;
const MINIMIZED_START_Y_OFFSET = 80; // Отступ от нижнего края

/**
 * Регистрирует свернутое окно и возвращает его позицию
 */
export function registerMinimizedModal(id: string): { x: number; y: number } {
  // Находим максимальный индекс позиции
  let maxPosition = -1;
  minimizedModals.forEach((modal) => {
    if (modal.position > maxPosition) {
      maxPosition = modal.position;
    }
  });

  // Новая позиция будет на 1 больше максимальной
  const newPosition = maxPosition + 1;
  minimizedModals.set(id, { id, position: newPosition });

  // Вычисляем координаты
  const x = MINIMIZED_START_X;
  const y = window.innerHeight - MINIMIZED_START_Y_OFFSET - (newPosition * (MINIMIZED_HEIGHT + MINIMIZED_SPACING));

  return { x, y };
}

/**
 * Удаляет регистрацию свернутого окна и пересчитывает позиции остальных
 */
export function unregisterMinimizedModal(id: string): void {
  const removed = minimizedModals.get(id);
  if (!removed) return;

  minimizedModals.delete(id);

  // Пересчитываем позиции остальных окон
  const remaining = Array.from(minimizedModals.values()).sort((a, b) => a.position - b.position);
  
  minimizedModals.clear();
  remaining.forEach((modal, index) => {
    minimizedModals.set(modal.id, { ...modal, position: index });
  });
}

/**
 * Обновляет позицию свернутого окна при изменении размера окна браузера
 */
export function updateMinimizedModalPosition(id: string): { x: number; y: number } | null {
  const modal = minimizedModals.get(id);
  if (!modal) return null;

  const x = MINIMIZED_START_X;
  const y = window.innerHeight - MINIMIZED_START_Y_OFFSET - (modal.position * (MINIMIZED_HEIGHT + MINIMIZED_SPACING));

  return { x, y };
}

/**
 * Получает все позиции свернутых окон для обновления при изменении размера окна
 */
export function getAllMinimizedModalPositions(): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  minimizedModals.forEach((modal) => {
    const x = MINIMIZED_START_X;
    const y = window.innerHeight - MINIMIZED_START_Y_OFFSET - (modal.position * (MINIMIZED_HEIGHT + MINIMIZED_SPACING));
    positions.set(modal.id, { x, y });
  });

  return positions;
}
