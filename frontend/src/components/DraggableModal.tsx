/**
 * @file: DraggableModal.tsx
 * @description: Draggable modal component with confirmation on close.
 * @dependencies: none
 * @created: 2026-01-27
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import './DraggableModal.css';
import {
  registerMinimizedModal,
  unregisterMinimizedModal,
  updateMinimizedModalPosition,
} from '../utils/minimizedModals';

interface DraggableModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'normal' | 'large';
  showOverlay?: boolean;
  hasChanges?: boolean;
}

export function DraggableModal({ title, children, onClose, size = 'normal', showOverlay = true, hasChanges = false }: DraggableModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const modalIdRef = useRef<string>(`modal-${Date.now()}-${Math.random()}`);

  // Функция центрирования окна
  const centerModal = useCallback(() => {
    if (isMinimized) return;
    
    // Используем CSS центрирование через transform
    // Позиция будет установлена в центре через CSS
    setPosition({ x: 0, y: 0 });
  }, [isMinimized]);

  useEffect(() => {
    // Центрируем модальное окно при первом открытии и при разворачивании
    if (!isMinimized) {
      centerModal();
    }
  }, [isMinimized, centerModal]);

  // Обновляем позиции свернутых окон при изменении размера окна браузера
  useEffect(() => {
    const handleResize = () => {
      if (isMinimized) {
        const newPos = updateMinimizedModalPosition(modalIdRef.current);
        if (newPos) {
          setPosition(newPos);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMinimized]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    const modalId = modalIdRef.current;
    return () => {
      if (isMinimized) {
        unregisterMinimizedModal(modalId);
      }
    };
  }, [isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Проверяем, что клик не на кнопке закрытия
    const target = e.target as HTMLElement;
    if (target.closest('.modal-close') || target.closest('.modal-minimize')) {
      return;
    }
    
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      setOverlayHidden(true); // Убираем затемнение при начале перетаскивания
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        setDragStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        // Сохраняем текущую позицию при начале перетаскивания
        setPosition({ x: rect.left, y: rect.top });
      }
    }
  };

  const handleHeaderDoubleClick = () => {
    // Двойной клик по заголовку возвращает затемнение
    setOverlayHidden(!overlayHidden);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Ограничиваем перемещение в пределах окна
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('Вы уверены, что хотите закрыть? Несохраненные изменения будут потеряны.');
      if (!confirmed) {
        return;
      }
    }
    // Освобождаем позицию при закрытии
    if (isMinimized) {
      unregisterMinimizedModal(modalIdRef.current);
    }
    onClose();
  };

  const handleMinimize = () => {
    if (isMinimized) {
      // Разворачиваем окно - центрируем на экране
      setIsMinimized(false);
      setOverlayHidden(false);
      
      // Освобождаем позицию в стекировании
      unregisterMinimizedModal(modalIdRef.current);
      
      // Сбрасываем позицию для центрирования через CSS
      setPosition({ x: 0, y: 0 });
    } else {
      // Сворачиваем окно - сохраняем текущую позицию
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
      }
      
      setIsMinimized(true);
      setOverlayHidden(true);
      
      // Регистрируем окно и получаем позицию
      const minimizedPos = registerMinimizedModal(modalIdRef.current);
      setPosition(minimizedPos);
    }
  };

  return (
    <div className={`modal-overlay ${!showOverlay || overlayHidden ? 'modal-overlay-transparent' : ''}`}>
      <div
        ref={modalRef}
        className={`modal ${size === 'large' ? 'modal-large' : ''} ${isDragging ? 'modal-dragging' : ''} ${isMinimized ? 'modal-minimized' : ''} ${!isMinimized && !isDragging ? 'modal-centered' : ''}`}
        style={isMinimized || isDragging ? {
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          margin: 0,
          transform: 'none',
          zIndex: isMinimized ? 1001 : 1000,
        } : {
          position: 'relative',
          margin: 'auto',
          zIndex: 1000,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isMinimized) {
            handleMinimize(); // Разворачиваем при клике на свернутое окно
          }
        }}
      >
        <div
          ref={headerRef}
          className={`modal-header modal-header-draggable ${overlayHidden ? 'modal-header-overlay-hidden' : ''}`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleHeaderDoubleClick}
          title={overlayHidden ? "Двойной клик для включения затемнения" : "Перетащите для перемещения. Двойной клик для отключения затемнения."}
        >
          <h2>{title}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="modal-minimize" 
              onClick={(e) => {
                e.stopPropagation();
                handleMinimize();
              }}
              title={isMinimized ? "Развернуть" : "Свернуть в трей"}
            >
              {isMinimized ? '□' : '−'}
            </button>
            <button className="modal-close" onClick={handleClose}>×</button>
          </div>
        </div>
        {!isMinimized && (
          <div className="modal-body">
            {children}
          </div>
        )}
        {isMinimized && (
          <div className="modal-minimized-indicator" style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {title}
          </div>
        )}
      </div>
    </div>
  );
}
