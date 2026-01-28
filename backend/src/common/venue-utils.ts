/**
 * @file: venue-utils.ts
 * @description: Утилиты для работы с venue (площадками)
 * @dependencies: none
 * @created: 2026-01-28
 */

/**
 * Извлекает название города из адреса или названия venue
 * @param address - адрес venue
 * @param name - название venue
 * @returns название города или null
 */
export function extractCityFromVenue(address?: string, name?: string): string | null {
  // Сначала пытаемся извлечь из адреса
  if (address) {
    // Формат обычно: "Город, улица..." или "Город, ..."
    const match = address.match(/^([^,]+),/);
    if (match) {
      const city = match[1].trim();
      if (city) {
        return city;
      }
    }
  }

  // Если в адресе не нашли, пытаемся из названия
  if (name) {
    // Формат может быть: "Город, Название площадки"
    const match = name.match(/^([^,]+),/);
    if (match) {
      const city = match[1].trim();
      if (city) {
        return city;
      }
    }
  }

  return null;
}
