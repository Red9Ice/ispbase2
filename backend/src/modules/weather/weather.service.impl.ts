/**
 * @file: weather.service.impl.ts
 * @description: Реализация сервиса погоды с использованием Open-Meteo API
 * @dependencies: weather.service.ts, weather.dto.ts
 * @created: 2026-01-28
 */

import { WeatherService } from './weather.service';
import { WeatherDto } from './dto/weather.dto';

// Вспомогательная функция для fetch с таймаутом
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа');
    }
    throw error;
  }
}

// Функция для преобразования weather_code в описание и иконку
function getWeatherDescription(code: number): { description: string; icon: string } {
  const weatherMap: Record<number, { description: string; icon: string }> = {
    0: { description: 'Ясно', icon: '☀️' },
    1: { description: 'Преимущественно ясно', icon: '🌤️' },
    2: { description: 'Переменная облачность', icon: '⛅' },
    3: { description: 'Пасмурно', icon: '☁️' },
    45: { description: 'Туман', icon: '🌫️' },
    48: { description: 'Изморозь', icon: '🌫️' },
    51: { description: 'Легкая морось', icon: '🌦️' },
    53: { description: 'Умеренная морось', icon: '🌦️' },
    55: { description: 'Сильная морось', icon: '🌦️' },
    56: { description: 'Легкая ледяная морось', icon: '🌨️' },
    57: { description: 'Сильная ледяная морось', icon: '🌨️' },
    61: { description: 'Небольшой дождь', icon: '🌧️' },
    63: { description: 'Умеренный дождь', icon: '🌧️' },
    65: { description: 'Сильный дождь', icon: '🌧️' },
    66: { description: 'Легкий ледяной дождь', icon: '🌨️' },
    67: { description: 'Сильный ледяной дождь', icon: '🌨️' },
    71: { description: 'Небольшой снег', icon: '❄️' },
    73: { description: 'Умеренный снег', icon: '❄️' },
    75: { description: 'Сильный снег', icon: '❄️' },
    77: { description: 'Снежная крупа', icon: '❄️' },
    80: { description: 'Небольшой ливень', icon: '🌧️' },
    81: { description: 'Умеренный ливень', icon: '🌧️' },
    82: { description: 'Сильный ливень', icon: '🌧️' },
    85: { description: 'Небольшой снегопад', icon: '❄️' },
    86: { description: 'Сильный снегопад', icon: '❄️' },
    95: { description: 'Гроза', icon: '⛈️' },
    96: { description: 'Гроза с градом', icon: '⛈️' },
    99: { description: 'Гроза с сильным градом', icon: '⛈️' },
  };

  return weatherMap[code] || { description: 'Неизвестно', icon: '☁️' };
}

export class WeatherServiceImpl implements WeatherService {
  /**
   * Получает погоду для указанного города и даты
   * @param city - название города
   * @param date - дата в формате ISO string
   * @returns данные о погоде или null при ошибке
   */
  async getWeatherByCity(city: string, date: string): Promise<WeatherDto | null> {
    try {
      // Получаем координаты города через геокодинг с таймаутом 5 секунд
      const geoResponse = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&accept-language=ru`,
        5000
      );

      if (!geoResponse.ok) {
        console.warn(`Geocoding failed for city: ${city}`);
        return null;
      }

      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) {
        console.warn(`City not found: ${city}`);
        return null;
      }

      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);

      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Invalid coordinates for city: ${city}`);
        return null;
      }

      // Преобразуем дату в формат для API (YYYY-MM-DD)
      const eventDate = new Date(date);
      const dateStr = eventDate.toISOString().split('T')[0];

      // Получаем погоду через Open-Meteo API
      // Используем исторические данные, если дата в прошлом, или прогноз, если в будущем
      const isPast = eventDate < new Date();
      const apiUrl = isPast
        ? `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_max,wind_speed_10m_max&timezone=auto`
        : `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_max,wind_speed_10m_max&timezone=auto`;

      // Запрос погоды с таймаутом 8 секунд
      const weatherResponse = await fetchWithTimeout(apiUrl, 8000);

      if (!weatherResponse.ok) {
        console.warn(`Weather API error for city: ${city}, date: ${dateStr}`);
        return null;
      }

      const weatherData = await weatherResponse.json();

      if (!weatherData.daily || weatherData.daily.time.length === 0) {
        console.warn(`No weather data for city: ${city}, date: ${dateStr}`);
        return null;
      }

      // Берем данные за нужную дату
      const dailyIndex = weatherData.daily.time.findIndex((d: string) => d === dateStr);
      if (dailyIndex === -1) {
        // Если точной даты нет, берем первую доступную
        const index = 0;
        const tempMax = weatherData.daily.temperature_2m_max[index];
        const tempMin = weatherData.daily.temperature_2m_min[index];
        const temp = Math.round((tempMax + tempMin) / 2);
        const weatherCode = weatherData.daily.weather_code[index];
        const humidity = weatherData.daily.relative_humidity_2m_max?.[index];
        const windSpeed = weatherData.daily.wind_speed_10m_max?.[index];

        const { description, icon } = getWeatherDescription(weatherCode);

        return {
          temperature: temp,
          description,
          icon,
          location: city,
          humidity: humidity ? Math.round(humidity) : undefined,
          windSpeed: windSpeed ? Math.round(windSpeed) : undefined,
          date: dateStr,
        };
      }

      const tempMax = weatherData.daily.temperature_2m_max[dailyIndex];
      const tempMin = weatherData.daily.temperature_2m_min[dailyIndex];
      const temp = Math.round((tempMax + tempMin) / 2);
      const weatherCode = weatherData.daily.weather_code[dailyIndex];
      const humidity = weatherData.daily.relative_humidity_2m_max?.[dailyIndex];
      const windSpeed = weatherData.daily.wind_speed_10m_max?.[dailyIndex];

      const { description, icon } = getWeatherDescription(weatherCode);

      return {
        temperature: temp,
        description,
        icon,
        location: city,
        humidity: humidity ? Math.round(humidity) : undefined,
        windSpeed: windSpeed ? Math.round(windSpeed) : undefined,
        date: dateStr,
      };
    } catch (error) {
      console.error(`Error fetching weather for city: ${city}, date: ${date}`, error);
      return null;
    }
  }
}
