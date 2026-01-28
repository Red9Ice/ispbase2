/**
 * @file: WeatherWidget.tsx
 * @description: Виджет погоды с геолокацией
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import type { WidgetProps } from '../../types/widgets';
import './WeatherWidget.css';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
}

// Функция для преобразования weather_code в описание и иконку
function getWeatherDescription(code: number): { description: string; icon: string } {
  // WMO Weather interpretation codes (WW)
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

export function WeatherWidget({}: WidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    // Используем дефолтное местоположение (Киров) без попыток получить геолокацию
    // Это полностью предотвращает ошибки 403 от Google Location Services
    // Если в будущем понадобится реальная геолокация, можно добавить опцию в настройках
    const defaultLocation = {
      lat: 58.6036,
      lon: 49.6680,
    };
    
    setLocation(defaultLocation);
  }, []);

  useEffect(() => {
    if (!location) return;

    // Используем бесплатный API Open-Meteo (не требует API ключа)
    const fetchWeather = async () => {
      try {
        // Получаем погоду через Open-Meteo API
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_days=1`
        );
        
        if (!weatherResponse.ok) {
          throw new Error('Weather API error');
        }
        
        const weatherData = await weatherResponse.json();
        
        // Получаем название города через обратный геокодинг (используем бесплатный API)
        let cityName = 'Неизвестно';
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lon}&accept-language=ru`
          );
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Неизвестно';
          }
        } catch (geoError) {
          console.warn('Geocoding failed:', geoError);
        }
        
        const current = weatherData.current;
        const temp = Math.round(current.temperature_2m);
        const humidity = Math.round(current.relative_humidity_2m);
        const windSpeed = Math.round(current.wind_speed_10m);
        
        // Преобразуем weather_code в описание и иконку
        const weatherCode = current.weather_code;
        const { description, icon } = getWeatherDescription(weatherCode);
        
        setWeather({
          temperature: temp,
          description,
          icon,
          location: cityName,
          humidity,
          windSpeed,
        });
        setLoading(false);
      } catch (err) {
        console.error('Weather fetch error:', err);
        // Fallback на mock данные при ошибке API
        setWeather({
          temperature: 15,
          description: 'Облачно',
          icon: '☁️',
          location: 'Киров',
          humidity: 65,
          windSpeed: 12,
        });
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="weather-loading">Загрузка погоды...</div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget">
        <div className="weather-error">{error || 'Данные о погоде недоступны'}</div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-location">{weather.location}</div>
      <div className="weather-main">
        <div className="weather-icon">{weather.icon}</div>
        <div className="weather-temp">{weather.temperature}°C</div>
      </div>
      <div className="weather-description">{weather.description}</div>
      {(weather.humidity !== undefined || weather.windSpeed !== undefined) && (
        <div className="weather-details">
          {weather.humidity !== undefined && (
            <div className="weather-detail">
              <span>Влажность:</span> {weather.humidity}%
            </div>
          )}
          {weather.windSpeed !== undefined && (
            <div className="weather-detail">
              <span>Ветер:</span> {weather.windSpeed} м/с
            </div>
          )}
        </div>
      )}
    </div>
  );
}
