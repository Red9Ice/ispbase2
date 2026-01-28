/**
 * @file: distance.service.impl.ts
 * @description: Реализация сервиса для расчета расстояния и времени поездки по трассе
 * @dependencies: distance.service.ts, distance.dto.ts
 * @created: 2026-01-28
 */

import { DistanceService } from './distance.service';
import { DistanceDto } from './dto/distance.dto';

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

// Координаты Кирова (основной город компании)
const KIROV_COORDS = {
  lat: 58.6036,
  lon: 49.6680,
  name: 'Киров',
};

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Форматирует расстояние в читаемый вид
 */
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} м`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} км`;
  }
  return `${Math.round(km)} км`;
}

/**
 * Форматирует время в читаемый вид
 */
function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0) {
    return `${m} мин`;
  }
  if (m === 0) {
    return `${h} ч`;
  }
  return `${h} ч ${m} мин`;
}

export class DistanceServiceImpl implements DistanceService {
  /**
   * Получает расстояние и время поездки по трассе (OSRM) от Кирова до города мероприятия.
   * @param city - город мероприятия
   * @param fromCity - город отправления (по умолчанию Киров)
   * @returns данные о расстоянии и времени или null при ошибке
   */
  async getDistanceAndTime(city: string, fromCity: string = KIROV_COORDS.name): Promise<DistanceDto | null> {
    try {
      if (city.toLowerCase().trim() === KIROV_COORDS.name.toLowerCase()) {
        return {
          distance: 0,
          time: 0,
          distanceFormatted: '0 км',
          timeFormatted: '0 мин',
          fromCity: KIROV_COORDS.name,
          toCity: city,
        };
      }

      // Геокодинг с таймаутом 5 секунд
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

      const toLat = parseFloat(geoData[0].lat);
      const toLon = parseFloat(geoData[0].lon);

      if (isNaN(toLat) || isNaN(toLon)) {
        console.warn(`Invalid coordinates for city: ${city}`);
        return null;
      }

      // OSRM: координаты в формате lon,lat;lon,lat
      const coords = `${KIROV_COORDS.lon},${KIROV_COORDS.lat};${toLon},${toLat}`;
      const osrmUrl = `${OSRM_BASE}/${coords}?overview=false`;

      // Запрос маршрута с таймаутом 8 секунд
      const routeResponse = await fetchWithTimeout(osrmUrl, 8000);

      if (!routeResponse.ok) {
        console.warn(`OSRM request failed for city: ${city}, status: ${routeResponse.status}`);
        return null;
      }

      const routeData = await routeResponse.json();

      if (routeData.code !== 'Ok' || !routeData.routes?.[0]) {
        console.warn(`OSRM no route for ${city}: ${routeData.code} ${routeData.message ?? ''}`);
        return null;
      }

      const route = routeData.routes[0];
      const distanceM = route.distance as number;
      const durationS = route.duration as number;

      const distanceKm = distanceM / 1000;
      const timeHours = durationS / 3600;

      return {
        distance: distanceKm,
        time: timeHours,
        distanceFormatted: formatDistance(distanceKm),
        timeFormatted: formatTime(timeHours),
        fromCity: KIROV_COORDS.name,
        toCity: city,
      };
    } catch (error) {
      console.error(`Error calculating distance for city: ${city}`, error);
      return null;
    }
  }
}
