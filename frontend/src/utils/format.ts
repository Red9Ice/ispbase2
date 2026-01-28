/**
 * @file: format.ts
 * @description: Shared formatting utilities.
 * @dependencies: none
 * @created: 2026-01-27
 */

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTimeRemaining(dueDate: string, createdAt?: string): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
  percentage: number;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);
  
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Рассчитываем процент оставшегося времени
  let percentage = 0;
  if (!isOverdue && createdAt) {
    const created = new Date(createdAt);
    const totalDiff = due.getTime() - created.getTime();
    const remainingDiff = due.getTime() - now.getTime();
    
    if (totalDiff > 0) {
      // Процент оставшегося времени от общего срока
      percentage = Math.max(0, Math.min(100, (remainingDiff / totalDiff) * 100));
    }
  } else if (!isOverdue) {
    // Если нет createdAt, используем эвристику: считаем, что задача создана 30 дней назад
    const totalDays = 30;
    percentage = Math.max(0, Math.min(100, (days / totalDays) * 100));
  }
  
  return {
    days,
    hours,
    minutes,
    isOverdue,
    percentage: isOverdue ? 0 : percentage,
  };
}

export function formatTimeRemaining(dueDate: string): string {
  const { days, hours, minutes, isOverdue } = getTimeRemaining(dueDate);
  
  if (isOverdue) {
    if (days > 0) {
      return `Просрочено на ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    } else if (hours > 0) {
      return `Просрочено на ${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    } else {
      return `Просрочено на ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}`;
    }
  } else {
    if (days > 0) {
      return `Осталось ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    } else if (hours > 0) {
      return `Осталось ${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    } else {
      return `Осталось ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}`;
    }
  }
}
