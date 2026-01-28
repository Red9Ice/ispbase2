/**
 * @file: event.dto.ts
 * @description: Draft DTOs for events.
 * @dependencies: none
 * @created: 2026-01-26
 */

import { WeatherDto } from '../../weather/dto/weather.dto';
import { DistanceDto } from '../../distance/dto/distance.dto';

export type EventStatus = 'draft' | 'request' | 'in_work' | 'completed' | 'canceled';

export interface EventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  contractPrice: number; // Цена контракта (было budgetPlanned)
  budgetActual: number;
  clientId: number;
  venueId: number;
  managerId?: number; // Менеджер
  foremanId?: number; // Бригадир
  commercialProposal?: string; // КП (коммерческое предложение)
  opm?: string; // ОПМ
  transport?: string; // Транспорт
  margin?: number; // Маржинальность (в процентах)
  profitability?: number; // Рентабельность (в процентах)
  weather?: WeatherDto;
  distance?: DistanceDto;
}
