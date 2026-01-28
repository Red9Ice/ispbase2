/**
 * @file: EventsListView.tsx
 * @description: Компонент списка мероприятий (текущий вид)
 * @dependencies: services/api.ts
 * @created: 2026-01-28
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import type { EventDto } from '../services/api';
import { formatDate } from '../utils/format';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  request: 'Запрос',
  in_work: 'В работе',
  completed: 'Завершено',
  canceled: 'Отменено',
};

const PAGE_SIZES = [10, 20, 50, 100, 200];

interface EventsListViewProps {
  events: EventDto[];
  loading: boolean;
  onEventClick: (eventId: number) => void;
  onEventEdit: (event: EventDto) => void;
}

export function EventsListView({ events, loading, onEventClick, onEventEdit }: EventsListViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('events-page-size');
    return saved ? parseInt(saved, 10) : 20;
  });
  const [showScrollArrows, setShowScrollArrows] = useState({ left: false, right: false });
  const [isScrolling, setIsScrolling] = useState({ left: false, right: false });
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Вычисляем пагинированные данные
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(events.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return {
      events: paginatedEvents,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, events.length),
      total: events.length,
    };
  }, [events, currentPage, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    localStorage.setItem('events-page-size', newSize.toString());
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении размера
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginatedData.totalPages) {
      setCurrentPage(page);
      // Прокручиваем к началу таблицы
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Генерируем массив страниц для отображения
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = paginatedData.totalPages;
    const current = currentPage;

    if (total <= 7) {
      // Если страниц мало, показываем все
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Всегда показываем первую страницу
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Показываем страницы вокруг текущей
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Всегда показываем последнюю страницу
      pages.push(total);
    }

    return pages;
  };

  // Проверка наличия горизонтального скролла
  useEffect(() => {
    const checkScroll = () => {
      const container = tableContainerRef.current;
      if (!container) return;

      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      setShowScrollArrows({
        left: hasHorizontalScroll && scrollLeft > 0,
        right: hasHorizontalScroll && scrollLeft < maxScrollLeft - 1,
      });
    };

    checkScroll();
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }

    // Проверяем после рендера
    setTimeout(checkScroll, 100);

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [paginatedData.events]);

  // Обработка автоматической прокрутки при наведении
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    if (isScrolling.left || isScrolling.right) {
      const scrollSpeed = 10; // пикселей за шаг
      const scrollStep = () => {
        if (isScrolling.left) {
          container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
        }
        if (isScrolling.right) {
          container.scrollLeft = Math.min(
            container.scrollWidth - container.clientWidth,
            container.scrollLeft + scrollSpeed
          );
        }
      };

      scrollIntervalRef.current = setInterval(scrollStep, 16); // ~60fps
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isScrolling]);

  const handleScrollArrowMouseEnter = (direction: 'left' | 'right') => {
    setIsScrolling({ left: direction === 'left', right: direction === 'right' });
  };

  const handleScrollArrowMouseLeave = () => {
    setIsScrolling({ left: false, right: false });
  };

  if (loading && events.length === 0) {
    return (
      <div className="panel-body">
        <div className="empty-state">Загрузка мероприятий...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="panel-body">
        <div className="empty-state">Мероприятия не найдены</div>
      </div>
    );
  }

  // Компонент выбора количества строк
  const PageSizeSelector = ({ id }: { id: string }) => (
    <div className="events-list-page-size-selector">
      <label htmlFor={id}>Строк на странице:</label>
      <select
        id={id}
        className="events-list-page-size-select"
        value={pageSize}
        onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );

  // Компонент информации о пагинации
  const PaginationInfo = () => (
    <div className="events-list-pagination-info">
      Показано {paginatedData.startIndex}–{paginatedData.endIndex} из {paginatedData.total}
    </div>
  );

  // Компонент навигации по страницам
  const PaginationNav = () => {
    if (paginatedData.totalPages <= 1) return null;

    return (
      <div className="events-list-pagination">
        <button
          className="events-list-pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Предыдущая страница"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div className="events-list-pagination-pages">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="events-list-pagination-ellipsis">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            return (
              <button
                key={pageNum}
                className={`events-list-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          className="events-list-pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === paginatedData.totalPages}
          title="Следующая страница"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Панель управления пагинацией вверху */}
      <div className="events-list-pagination-controls">
        <PageSizeSelector id="page-size-select-top" />
        <PaginationInfo />
        <PaginationNav />
      </div>

      <div className="table-container-wrapper" style={{ position: 'relative' }}>
        {showScrollArrows.left && (
          <div
            className="events-list-scroll-zone events-list-scroll-zone-left"
            onMouseEnter={() => handleScrollArrowMouseEnter('left')}
            onMouseLeave={handleScrollArrowMouseLeave}
            aria-label="Прокрутить влево"
          >
            <div className="events-list-scroll-gradient events-list-scroll-gradient-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </div>
          </div>
        )}
        <div className="table-container" ref={tableContainerRef}>
          <table className="table">
          <thead>
            <tr>
              <th>Мероприятие</th>
              <th>Статус</th>
              <th>Дата начала</th>
              <th>Дата окончания</th>
              <th>Бюджет</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.events.map((event) => (
              <tr 
                key={event.id} 
                data-event-id={event.id} 
                className="table-row-clickable" 
                onClick={() => event.id && onEventClick(event.id)}
              >
                <td>{event.title}</td>
                <td>
                  <span className={`tag ${event.status}`}>
                    {STATUS_LABELS[event.status] ?? event.status}
                  </span>
                </td>
                <td>{formatDate(event.startDate)}</td>
                <td>{formatDate(event.endDate)}</td>
                <td>{(event.contractPrice || 0).toLocaleString('ru-RU')} ₽</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="button-link" onClick={() => onEventEdit(event)}>
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {showScrollArrows.right && (
          <div
            className="events-list-scroll-zone events-list-scroll-zone-right"
            onMouseEnter={() => handleScrollArrowMouseEnter('right')}
            onMouseLeave={handleScrollArrowMouseLeave}
            aria-label="Прокрутить вправо"
          >
            <div className="events-list-scroll-gradient events-list-scroll-gradient-right">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="table-mobile">
        {paginatedData.events.map((event) => (
          <div 
            key={event.id} 
            data-event-id={event.id} 
            className="table-mobile-card" 
            onClick={() => event.id && onEventClick(event.id)}
          >
            <div className="table-mobile-row">
              <div className="table-mobile-label">Мероприятие</div>
              <div className="table-mobile-value">{event.title}</div>
            </div>
            <div className="table-mobile-row">
              <div className="table-mobile-label">Статус</div>
              <div className="table-mobile-value">
                <span className={`tag ${event.status}`}>
                  {STATUS_LABELS[event.status] ?? event.status}
                </span>
              </div>
            </div>
            <div className="table-mobile-row">
              <div className="table-mobile-label">Дата начала</div>
              <div className="table-mobile-value">{formatDate(event.startDate)}</div>
            </div>
            <div className="table-mobile-row">
              <div className="table-mobile-label">Дата окончания</div>
              <div className="table-mobile-value">{formatDate(event.endDate)}</div>
            </div>
            <div className="table-mobile-row">
              <div className="table-mobile-label">Бюджет</div>
              <div className="table-mobile-value">
                {(event.contractPrice || 0).toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="table-mobile-actions" onClick={(e) => e.stopPropagation()}>
              <button className="button-secondary" onClick={() => onEventEdit(event)}>
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Панель управления пагинацией внизу */}
      <div className="events-list-pagination-controls">
        <PageSizeSelector id="page-size-select-bottom" />
        <PaginationInfo />
        <PaginationNav />
      </div>
    </>
  );
}
