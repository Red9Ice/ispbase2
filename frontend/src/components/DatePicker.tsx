/**
 * @file: DatePicker.tsx
 * @description: Современный компонент выбора даты с календарем в стиле Яндекс Путешествий
 * @dependencies: DatePicker.css
 * @created: 2026-01-28
 */

import { useState, useRef, useEffect } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  value: string; // Формат YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  min?: string; // Минимальная дата в формате YYYY-MM-DD
  max?: string; // Максимальная дата в формате YYYY-MM-DD
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Выберите дату',
  className = '',
  error = false,
  disabled = false,
  min,
  max,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const monthsListRef = useRef<HTMLDivElement>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Инициализируем месяц на основе выбранной даты или текущей даты
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } else {
      setSelectedMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
  }, [value]);

  // Вычисляем позицию календаря при открытии
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      let top = rect.bottom + 4;
      let left = rect.left;
      
      const calendarHeight = 500;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      
      if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
        top = rect.top - calendarHeight - 4;
      }
      
      const calendarWidth = 600;
      const viewportWidth = window.innerWidth;
      const spaceRight = viewportWidth - rect.left;
      
      if (spaceRight < calendarWidth) {
        left = rect.right - calendarWidth;
      }
      
      if (left < 8) {
        left = 8;
      }
      
      if (left + calendarWidth > viewportWidth - 8) {
        left = viewportWidth - calendarWidth - 8;
      }
      
      setCalendarPosition({ top, left });
    }
  }, [isOpen]);

  // Синхронизация прокрутки месяцев и календаря
  useEffect(() => {
    if (isOpen && calendarScrollRef.current && monthsListRef.current) {
      const scrollToMonth = (monthDate: Date) => {
        const monthElement = calendarScrollRef.current?.querySelector(
          `[data-month="${monthDate.getFullYear()}-${monthDate.getMonth()}"]`
        ) as HTMLElement;
        
        if (monthElement) {
          monthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      scrollToMonth(selectedMonth);
    }
  }, [selectedMonth, isOpen]);

  // Закрываем календарь при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      // Закрываем календарь только если скролл происходит вне календаря
      const target = event.target as Node;
      if (
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      // При изменении размера окна пересчитываем позицию, но не закрываем
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        let top = rect.bottom + 4;
        let left = rect.left;
        
        const calendarHeight = 500;
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        
        if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
          top = rect.top - calendarHeight - 4;
        }
        
        const calendarWidth = 600;
        const viewportWidth = window.innerWidth;
        const spaceRight = viewportWidth - rect.left;
        
        if (spaceRight < calendarWidth) {
          left = rect.right - calendarWidth;
        }
        
        if (left < 8) {
          left = 8;
        }
        
        if (left + calendarWidth > viewportWidth - 8) {
          left = viewportWidth - calendarWidth - 8;
        }
        
        setCalendarPosition({ top, left });
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Начинаем с понедельника (0 = воскресенье, 1 = понедельник)
    const startDay = firstDay.getDay();
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1; // Понедельник = 0
    
    const days: Date[] = [];
    
    // Добавляем дни предыдущего месяца
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Добавляем дни следующего месяца до заполнения сетки (42 дня = 6 недель)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!value) return false;
    const selected = new Date(value + 'T00:00:00');
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isDisabled = (date: Date): boolean => {
    if (min) {
      const minDate = new Date(min + 'T00:00:00');
      if (date < minDate) return true;
    }
    if (max) {
      const maxDate = new Date(max + 'T23:59:59');
      if (date > maxDate) return true;
    }
    return false;
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // Воскресенье или суббота
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleMonthClick = (year: number, month: number) => {
    setSelectedMonth(new Date(year, month, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setSelectedMonth(new Date(year, today.getMonth(), 1));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Генерируем список месяцев для отображения (текущий год и следующий)
  const currentYear = new Date().getFullYear();
  const monthsList: Array<{ year: number; month: number; date: Date }> = [];
  
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let month = 0; month < 12; month++) {
      monthsList.push({
        year,
        month,
        date: new Date(year, month, 1),
      });
    }
  }

  // Генерируем календари для всех месяцев
  const calendarMonths = monthsList.map(({ year, month, date }) => ({
    year,
    month,
    date,
    days: getDaysInMonth(date),
  }));

  const isMonthSelected = (year: number, month: number): boolean => {
    return (
      selectedMonth.getFullYear() === year &&
      selectedMonth.getMonth() === month
    );
  };

  return (
    <div className={`date-picker-wrapper ${className}`} ref={containerRef}>
      <div
        className={`date-picker-input ${error ? 'date-picker-input-error' : ''} ${disabled ? 'date-picker-input-disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`date-picker-value ${!value ? 'date-picker-placeholder' : ''}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <svg
          className={`date-picker-icon ${isOpen ? 'date-picker-icon-open' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 2V4M14 2V4M3 8H17M4 4H16C16.5523 4 17 4.44772 17 5V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V5C3 4.44772 3.44772 4 4 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div 
          className="date-picker-calendar date-picker-calendar-yandex" 
          ref={calendarRef}
          style={{
            top: `${calendarPosition.top}px`,
            left: `${calendarPosition.left}px`,
          }}
        >
          <div className="date-picker-calendar-content">
            {/* Боковая панель с месяцами */}
            <div className="date-picker-months-sidebar" ref={monthsListRef}>
              {monthsList.map(({ year, month, date }) => (
                <button
                  key={`${year}-${month}`}
                  type="button"
                  className={`date-picker-month-item ${
                    isMonthSelected(year, month) ? 'date-picker-month-item-active' : ''
                  }`}
                  onClick={() => handleMonthClick(year, month)}
                >
                  {MONTHS[month]} {year === currentYear ? '' : year}
                </button>
              ))}
            </div>

            {/* Основная область календаря */}
            <div className="date-picker-calendar-main" ref={calendarScrollRef}>
              {calendarMonths.map(({ year, month, date, days }) => (
                <div
                  key={`${year}-${month}`}
                  className="date-picker-month-calendar"
                  data-month={`${year}-${month}`}
                >
                  <div className="date-picker-month-title">
                    {MONTHS[month]} {year}
                  </div>
                  
                  <div className="date-picker-weekdays">
                    {WEEKDAYS_SHORT.map((day, index) => (
                      <div
                        key={index}
                        className={`date-picker-weekday ${
                          index >= 5 ? 'date-picker-weekday-weekend' : ''
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="date-picker-days">
                    {days.map((day, index) => {
                      const isCurrentMonth = day.getMonth() === month;
                      const dayIsToday = isToday(day);
                      const dayIsSelected = isSelected(day);
                      const dayIsDisabled = isDisabled(day);
                      const dayIsWeekend = isWeekend(day);

                      return (
                        <button
                          key={index}
                          type="button"
                          className={`date-picker-day ${
                            !isCurrentMonth ? 'date-picker-day-other-month' : ''
                          } ${dayIsToday ? 'date-picker-day-today' : ''} ${
                            dayIsSelected ? 'date-picker-day-selected' : ''
                          } ${dayIsDisabled ? 'date-picker-day-disabled' : ''} ${
                            dayIsWeekend ? 'date-picker-day-weekend' : ''
                          }`}
                          onClick={() => handleDateClick(day)}
                          disabled={dayIsDisabled}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="date-picker-footer">
            <button type="button" className="date-picker-footer-btn" onClick={handleToday}>
              Сегодня
            </button>
            {value && (
              <button type="button" className="date-picker-footer-btn" onClick={handleClear}>
                Очистить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
