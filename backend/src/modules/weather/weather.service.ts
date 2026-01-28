/**
 * @file: weather.service.ts
 * @description: Интерфейс сервиса погоды
 * @dependencies: weather.dto.ts
 * @created: 2026-01-28
 */

import { WeatherDto } from './dto/weather.dto';

export interface WeatherService {
  getWeatherByCity(city: string, date: string): Promise<WeatherDto | null>;
}
