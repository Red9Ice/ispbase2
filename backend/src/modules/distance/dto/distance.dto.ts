/**
 * @file: distance.dto.ts
 * @description: DTO для данных о расстоянии и времени поездки
 * @dependencies: none
 * @created: 2026-01-28
 */

export interface DistanceDto {
  distance: number; // расстояние в километрах
  time: number; // время в часах
  distanceFormatted: string; // отформатированное расстояние (например, "450 км")
  timeFormatted: string; // отформатированное время (например, "5 ч 30 мин")
  fromCity: string;
  toCity: string;
}
