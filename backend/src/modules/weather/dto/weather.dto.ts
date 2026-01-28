/**
 * @file: weather.dto.ts
 * @description: DTO для данных о погоде
 * @dependencies: none
 * @created: 2026-01-28
 */

export interface WeatherDto {
  temperature: number;
  description: string;
  icon: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  date: string;
}
