/**
 * @file: weather.controller.ts
 * @description: Weather controller.
 * @dependencies: weather.service.ts, weather.dto.ts
 * @created: 2026-01-28
 */

import { WeatherService } from './weather.service';
import { WeatherDto } from './dto/weather.dto';

export class WeatherController {
  constructor(private readonly service: WeatherService) {}

  async getWeatherByCity(city: string, date: string): Promise<WeatherDto | null> {
    return this.service.getWeatherByCity(city, date);
  }
}
