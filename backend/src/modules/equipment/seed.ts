/**
 * @file: seed.ts
 * @description: Seed equipment categories and equipment items.
 * @dependencies: equipment-categories, equipment repositories
 * @created: 2026-01-27
 */

import { EquipmentCategoriesRepository } from '../equipment-categories/equipment-categories.repository';
import { EquipmentRepository } from './equipment.repository';
import type { EquipmentRecord } from './equipment.repository';
import type { EquipmentStatus } from './dto/equipment.dto';

// Дополнительные категории (под «Прочее», parentId: 4)
const ADDITIONAL_CATEGORIES = [
  { name: 'Видео', description: 'Видеооборудование и проекторы', parentId: 4 as number },
  { name: 'Сценическое', description: 'Сценическое оборудование и декорации', parentId: 4 },
  { name: 'Кабели', description: 'Кабели и провода', parentId: 4 },
  { name: 'Инструменты', description: 'Инструменты и расходные материалы', parentId: 4 },
  { name: 'Транспорт', description: 'Транспорт для перевозки оборудования', parentId: 4 },
  { name: 'Безопасность', description: 'Оборудование для безопасности', parentId: 4 },
];

// Оборудование для заполнения
const EQUIPMENT_DATA = [
  // Свет (categoryId: 1)
  { name: 'LED прожектор RGBW 300W', model: 'LP-300-RGBW', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-LP300-001', status: 'available' as EquipmentStatus },
  { name: 'LED прожектор RGBW 300W', model: 'LP-300-RGBW', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-LP300-002', status: 'available' as EquipmentStatus },
  { name: 'LED прожектор RGBW 300W', model: 'LP-300-RGBW', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-LP300-003', status: 'in_use' as EquipmentStatus },
  { name: 'LED прожектор RGBW 500W', model: 'LP-500-RGBW', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-LP500-001', status: 'available' as EquipmentStatus },
  { name: 'LED прожектор RGBW 500W', model: 'LP-500-RGBW', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-LP500-002', status: 'available' as EquipmentStatus },
  { name: 'Светодиодная панель 100x100', model: 'LED-PANEL-100', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LP100-001', status: 'available' as EquipmentStatus },
  { name: 'Светодиодная панель 100x100', model: 'LED-PANEL-100', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LP100-002', status: 'available' as EquipmentStatus },
  { name: 'Светодиодная панель 100x100', model: 'LED-PANEL-100', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LP100-003', status: 'maintenance' as EquipmentStatus },
  { name: 'Светодиодная лента RGB 5м', model: 'LED-STRIP-RGB-5M', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LS5M-001', status: 'available' as EquipmentStatus },
  { name: 'Светодиодная лента RGB 5м', model: 'LED-STRIP-RGB-5M', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LS5M-002', status: 'available' as EquipmentStatus },
  { name: 'Светодиодная лента RGB 5м', model: 'LED-STRIP-RGB-5M', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LS5M-003', status: 'available' as EquipmentStatus },
  { name: 'Светодиодная лента RGB 5м', model: 'LED-STRIP-RGB-5M', manufacturer: 'BrightStar', categoryId: 1, serialNumber: 'BS-LS5M-004', status: 'in_use' as EquipmentStatus },
  { name: 'Прожектор галогенный 1000W', model: 'HAL-1000', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-HAL1K-001', status: 'available' as EquipmentStatus },
  { name: 'Прожектор галогенный 1000W', model: 'HAL-1000', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-HAL1K-002', status: 'available' as EquipmentStatus },
  { name: 'Прожектор галогенный 1000W', model: 'HAL-1000', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-HAL1K-003', status: 'retired' as EquipmentStatus },
  { name: 'Диммер 6 каналов', model: 'DIM-6CH', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-DIM6-001', status: 'available' as EquipmentStatus },
  { name: 'Диммер 6 каналов', model: 'DIM-6CH', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-DIM6-002', status: 'available' as EquipmentStatus },
  { name: 'Диммер 12 каналов', model: 'DIM-12CH', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-DIM12-001', status: 'in_use' as EquipmentStatus },
  { name: 'Диммер 12 каналов', model: 'DIM-12CH', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-DIM12-002', status: 'available' as EquipmentStatus },
  { name: 'Консоль световая DMX', model: 'DMX-CONSOLE-PRO', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-DMX-CP-001', status: 'available' as EquipmentStatus },
  { name: 'Консоль световая DMX', model: 'DMX-CONSOLE-PRO', manufacturer: 'LightTech', categoryId: 1, serialNumber: 'LT-DMX-CP-002', status: 'in_use' as EquipmentStatus },

  // Звук (categoryId: 2)
  { name: 'Активная колонка 15" 1000W', model: 'SPK-15A-1000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SPK15A-001', status: 'available' as EquipmentStatus },
  { name: 'Активная колонка 15" 1000W', model: 'SPK-15A-1000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SPK15A-002', status: 'available' as EquipmentStatus },
  { name: 'Активная колонка 15" 1000W', model: 'SPK-15A-1000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SPK15A-003', status: 'in_use' as EquipmentStatus },
  { name: 'Активная колонка 15" 1000W', model: 'SPK-15A-1000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SPK15A-004', status: 'available' as EquipmentStatus },
  { name: 'Сабвуфер 18" 2000W', model: 'SUB-18-2000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SUB18-001', status: 'available' as EquipmentStatus },
  { name: 'Сабвуфер 18" 2000W', model: 'SUB-18-2000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SUB18-002', status: 'available' as EquipmentStatus },
  { name: 'Сабвуфер 18" 2000W', model: 'SUB-18-2000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SUB18-003', status: 'in_use' as EquipmentStatus },
  { name: 'Микшерный пульт 24 канала', model: 'MIX-24CH', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-MIX24-001', status: 'available' as EquipmentStatus },
  { name: 'Микшерный пульт 24 канала', model: 'MIX-24CH', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-MIX24-002', status: 'in_use' as EquipmentStatus },
  { name: 'Микшерный пульт 32 канала', model: 'MIX-32CH', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-MIX32-001', status: 'available' as EquipmentStatus },
  { name: 'Радиомикрофон UHF', model: 'RF-MIC-UHF', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-RFMIC-001', status: 'available' as EquipmentStatus },
  { name: 'Радиомикрофон UHF', model: 'RF-MIC-UHF', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-RFMIC-002', status: 'available' as EquipmentStatus },
  { name: 'Радиомикрофон UHF', model: 'RF-MIC-UHF', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-RFMIC-003', status: 'in_use' as EquipmentStatus },
  { name: 'Радиомикрофон UHF', model: 'RF-MIC-UHF', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-RFMIC-004', status: 'available' as EquipmentStatus },
  { name: 'Микрофон вокальный SM58', model: 'MIC-SM58', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SM58-001', status: 'available' as EquipmentStatus },
  { name: 'Микрофон вокальный SM58', model: 'MIC-SM58', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SM58-002', status: 'available' as EquipmentStatus },
  { name: 'Микрофон вокальный SM58', model: 'MIC-SM58', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SM58-003', status: 'available' as EquipmentStatus },
  { name: 'Микрофон вокальный SM58', model: 'MIC-SM58', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SM58-004', status: 'in_use' as EquipmentStatus },
  { name: 'Микрофон вокальный SM58', model: 'MIC-SM58', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-SM58-005', status: 'available' as EquipmentStatus },
  { name: 'Усилитель мощности 2x2000W', model: 'AMP-2X2000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-AMP2K-001', status: 'available' as EquipmentStatus },
  { name: 'Усилитель мощности 2x2000W', model: 'AMP-2X2000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-AMP2K-002', status: 'available' as EquipmentStatus },
  { name: 'Усилитель мощности 2x2000W', model: 'AMP-2X2000', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-AMP2K-003', status: 'maintenance' as EquipmentStatus },
  { name: 'Процессор звука DSP', model: 'DSP-PRO', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-DSP-001', status: 'available' as EquipmentStatus },
  { name: 'Процессор звука DSP', model: 'DSP-PRO', manufacturer: 'SoundMax', categoryId: 2, serialNumber: 'SM-DSP-002', status: 'in_use' as EquipmentStatus },

  // Ригг (categoryId: 3)
  { name: 'Труба сценическая 50x3м', model: 'TRUSS-50X3', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-001', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x3м', model: 'TRUSS-50X3', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-002', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x3м', model: 'TRUSS-50X3', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-003', status: 'in_use' as EquipmentStatus },
  { name: 'Труба сценическая 50x3м', model: 'TRUSS-50X3', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-004', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x2м', model: 'TRUSS-50X2', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-2M-001', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x2м', model: 'TRUSS-50X2', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-2M-002', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x2м', model: 'TRUSS-50X2', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-2M-003', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x2м', model: 'TRUSS-50X2', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-2M-004', status: 'in_use' as EquipmentStatus },
  { name: 'Труба сценическая 50x2м', model: 'TRUSS-50X2', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-2M-005', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-001', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-002', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-003', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-004', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-005', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-006', status: 'available' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-007', status: 'in_use' as EquipmentStatus },
  { name: 'Труба сценическая 50x1м', model: 'TRUSS-50X1', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-TR50-1M-008', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-001', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-002', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-003', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-004', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-005', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-006', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-007', status: 'in_use' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-008', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-009', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-010', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-011', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-012', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-013', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-014', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-015', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-016', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-017', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-018', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-019', status: 'available' as EquipmentStatus },
  { name: 'Подвес для прожектора', model: 'CLAMP-PRO', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-CLAMP-020', status: 'available' as EquipmentStatus },
  { name: 'Лебедка электрическая 500кг', model: 'WINCH-500KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH-001', status: 'available' as EquipmentStatus },
  { name: 'Лебедка электрическая 500кг', model: 'WINCH-500KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH-002', status: 'available' as EquipmentStatus },
  { name: 'Лебедка электрическая 500кг', model: 'WINCH-500KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH-003', status: 'in_use' as EquipmentStatus },
  { name: 'Лебедка электрическая 500кг', model: 'WINCH-500KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH-004', status: 'available' as EquipmentStatus },
  { name: 'Лебедка электрическая 1000кг', model: 'WINCH-1000KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH1K-001', status: 'available' as EquipmentStatus },
  { name: 'Лебедка электрическая 1000кг', model: 'WINCH-1000KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH1K-002', status: 'available' as EquipmentStatus },
  { name: 'Лебедка электрическая 1000кг', model: 'WINCH-1000KG', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-WINCH1K-003', status: 'maintenance' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-001', status: 'available' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-002', status: 'available' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-003', status: 'available' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-004', status: 'available' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-005', status: 'available' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-006', status: 'in_use' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-007', status: 'available' as EquipmentStatus },
  { name: 'Основание для трубы', model: 'BASE-TRUSS', manufacturer: 'RigPro', categoryId: 3, serialNumber: 'RP-BASE-008', status: 'available' as EquipmentStatus },

  // Прочее (categoryId: 4)
  { name: 'Генератор дизельный 20кВт', model: 'GEN-20KW', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-GEN20-001', status: 'available' as EquipmentStatus },
  { name: 'Генератор дизельный 20кВт', model: 'GEN-20KW', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-GEN20-002', status: 'available' as EquipmentStatus },
  { name: 'Генератор дизельный 50кВт', model: 'GEN-50KW', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-GEN50-001', status: 'available' as EquipmentStatus },
  { name: 'Генератор дизельный 50кВт', model: 'GEN-50KW', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-GEN50-002', status: 'in_use' as EquipmentStatus },
  { name: 'Распределительный щит 3x32A', model: 'PDU-3X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU-001', status: 'available' as EquipmentStatus },
  { name: 'Распределительный щит 3x32A', model: 'PDU-3X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU-002', status: 'available' as EquipmentStatus },
  { name: 'Распределительный щит 3x32A', model: 'PDU-3X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU-003', status: 'available' as EquipmentStatus },
  { name: 'Распределительный щит 3x32A', model: 'PDU-3X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU-004', status: 'in_use' as EquipmentStatus },
  { name: 'Распределительный щит 3x32A', model: 'PDU-3X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU-005', status: 'available' as EquipmentStatus },
  { name: 'Распределительный щит 5x32A', model: 'PDU-5X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU5-001', status: 'available' as EquipmentStatus },
  { name: 'Распределительный щит 5x32A', model: 'PDU-5X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU5-002', status: 'available' as EquipmentStatus },
  { name: 'Распределительный щит 5x32A', model: 'PDU-5X32A', manufacturer: 'PowerGen', categoryId: 4, serialNumber: 'PG-PDU5-003', status: 'maintenance' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-001', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-002', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-003', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-004', status: 'in_use' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-005', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-006', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-007', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-008', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-009', status: 'available' as EquipmentStatus },
  { name: 'Стол монтажный складной', model: 'TABLE-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-TBL-010', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-001', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-002', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-003', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-004', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-005', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-006', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-007', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-008', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-009', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-010', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-011', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-012', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-013', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-014', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-015', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-016', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-017', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-018', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-019', status: 'available' as EquipmentStatus },
  { name: 'Стул складной', model: 'CHAIR-FOLD', manufacturer: 'StagePro', categoryId: 4, serialNumber: 'SP-CHAIR-020', status: 'available' as EquipmentStatus },
];

export function seedEquipment(
  categoriesRepo: EquipmentCategoriesRepository,
  equipmentRepo: EquipmentRepository,
): void {
  // Добавляем дополнительные категории
  const existingCategories = categoriesRepo.list();
  const categoryNameToId = new Map<string, number>(); // имя -> id
  
  // Сохраняем существующие категории
  existingCategories.forEach(cat => {
    categoryNameToId.set(cat.name, cat.id);
  });

  // Добавляем новые категории (под «Прочее»)
  ADDITIONAL_CATEGORIES.forEach(catData => {
    if (!categoryNameToId.has(catData.name)) {
      const newCat = categoriesRepo.create({ name: catData.name, description: catData.description, parentId: catData.parentId });
      categoryNameToId.set(newCat.name, newCat.id);
    }
  });

  // Если оборудование уже есть, не добавляем снова
  if (equipmentRepo.list().length > 0) {
    return;
  }

  // Добавляем оборудование для новых категорий
  const additionalEquipment = [
    // Видео (динамический ID)
    { name: 'Проектор Full HD 5000lm', model: 'PROJ-FHD-5K', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-PROJ-001', status: 'available' as EquipmentStatus },
    { name: 'Проектор Full HD 5000lm', model: 'PROJ-FHD-5K', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-PROJ-002', status: 'available' as EquipmentStatus },
    { name: 'Проектор Full HD 5000lm', model: 'PROJ-FHD-5K', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-PROJ-003', status: 'in_use' as EquipmentStatus },
    { name: 'Проектор 4K 8000lm', model: 'PROJ-4K-8K', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-PROJ4K-001', status: 'available' as EquipmentStatus },
    { name: 'Проектор 4K 8000lm', model: 'PROJ-4K-8K', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-PROJ4K-002', status: 'available' as EquipmentStatus },
    { name: 'LED экран P3 2x2м', model: 'LED-P3-2X2', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-LEDP3-001', status: 'available' as EquipmentStatus },
    { name: 'LED экран P3 2x2м', model: 'LED-P3-2X2', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-LEDP3-002', status: 'available' as EquipmentStatus },
    { name: 'LED экран P3 2x2м', model: 'LED-P3-2X2', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-LEDP3-003', status: 'in_use' as EquipmentStatus },
    { name: 'LED экран P3 2x2м', model: 'LED-P3-2X2', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-LEDP3-004', status: 'available' as EquipmentStatus },
    { name: 'Видеомикшер 4 канала', model: 'VMIX-4CH', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-VMIX-001', status: 'available' as EquipmentStatus },
    { name: 'Видеомикшер 4 канала', model: 'VMIX-4CH', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-VMIX-002', status: 'in_use' as EquipmentStatus },
    { name: 'Видеомикшер 8 каналов', model: 'VMIX-8CH', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-VMIX8-001', status: 'available' as EquipmentStatus },
    { name: 'Камера PTZ Full HD', model: 'CAM-PTZ-FHD', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-CAM-001', status: 'available' as EquipmentStatus },
    { name: 'Камера PTZ Full HD', model: 'CAM-PTZ-FHD', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-CAM-002', status: 'available' as EquipmentStatus },
    { name: 'Камера PTZ Full HD', model: 'CAM-PTZ-FHD', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-CAM-003', status: 'in_use' as EquipmentStatus },
    { name: 'Камера PTZ Full HD', model: 'CAM-PTZ-FHD', manufacturer: 'VideoPro', categoryName: 'Видео', serialNumber: 'VP-CAM-004', status: 'available' as EquipmentStatus },
    
    // Сценическое
    { name: 'Занавес сценический 6x4м', model: 'CURTAIN-6X4', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-CUR-001', status: 'available' as EquipmentStatus },
    { name: 'Занавес сценический 6x4м', model: 'CURTAIN-6X4', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-CUR-002', status: 'available' as EquipmentStatus },
    { name: 'Занавес сценический 6x4м', model: 'CURTAIN-6X4', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-CUR-003', status: 'in_use' as EquipmentStatus },
    { name: 'Занавес сценический 8x5м', model: 'CURTAIN-8X5', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-CUR8-001', status: 'available' as EquipmentStatus },
    { name: 'Занавес сценический 8x5м', model: 'CURTAIN-8X5', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-CUR8-002', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-001', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-002', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-003', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-004', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-005', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-006', status: 'in_use' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-007', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-008', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-009', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-010', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-011', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-012', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-013', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-014', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-015', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-016', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-017', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-018', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-019', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-020', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-021', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-022', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-023', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-024', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-025', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-026', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-027', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-028', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-029', status: 'available' as EquipmentStatus },
    { name: 'Подиум 1x1м', model: 'PODIUM-1X1', manufacturer: 'StagePro', categoryName: 'Сценическое', serialNumber: 'SP-POD-030', status: 'available' as EquipmentStatus },
    
    // Кабели
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-001', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-002', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-003', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-004', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-005', status: 'in_use' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-006', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-007', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-008', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-009', status: 'available' as EquipmentStatus },
    { name: 'Кабель DMX 3x0.75 50м', model: 'CABLE-DMX-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-DMX50-010', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-001', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-002', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-003', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-004', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-005', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-006', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-007', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-008', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-009', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-010', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-011', status: 'in_use' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-012', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-013', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-014', status: 'available' as EquipmentStatus },
    { name: 'Кабель XLR 3pin 20м', model: 'CABLE-XLR-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-XLR20-015', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-001', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-002', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-003', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-004', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-005', status: 'in_use' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-006', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-007', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-008', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-009', status: 'available' as EquipmentStatus },
    { name: 'Кабель силовой 3x2.5 50м', model: 'CABLE-PWR-50M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-PWR50-010', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-001', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-002', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-003', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-004', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-005', status: 'in_use' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-006', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-007', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-008', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-009', status: 'available' as EquipmentStatus },
    { name: 'Кабель HDMI 20м', model: 'CABLE-HDMI-20M', manufacturer: 'CablePro', categoryName: 'Кабели', serialNumber: 'CP-HDMI20-010', status: 'available' as EquipmentStatus },
    
    // Инструменты
    { name: 'Отвертка набор', model: 'SCREWDRIVER-SET', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-SD-001', status: 'available' as EquipmentStatus },
    { name: 'Отвертка набор', model: 'SCREWDRIVER-SET', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-SD-002', status: 'available' as EquipmentStatus },
    { name: 'Отвертка набор', model: 'SCREWDRIVER-SET', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-SD-003', status: 'in_use' as EquipmentStatus },
    { name: 'Ключ разводной', model: 'WRENCH-ADJ', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-WR-001', status: 'available' as EquipmentStatus },
    { name: 'Ключ разводной', model: 'WRENCH-ADJ', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-WR-002', status: 'available' as EquipmentStatus },
    { name: 'Ключ разводной', model: 'WRENCH-ADJ', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-WR-003', status: 'available' as EquipmentStatus },
    { name: 'Ключ разводной', model: 'WRENCH-ADJ', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-WR-004', status: 'available' as EquipmentStatus },
    { name: 'Ключ разводной', model: 'WRENCH-ADJ', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-WR-005', status: 'available' as EquipmentStatus },
    { name: 'Паяльник 60W', model: 'SOLDER-60W', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-SOL-001', status: 'available' as EquipmentStatus },
    { name: 'Паяльник 60W', model: 'SOLDER-60W', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-SOL-002', status: 'available' as EquipmentStatus },
    { name: 'Мультиметр', model: 'MULTIMETER', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-MM-001', status: 'available' as EquipmentStatus },
    { name: 'Мультиметр', model: 'MULTIMETER', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-MM-002', status: 'available' as EquipmentStatus },
    { name: 'Мультиметр', model: 'MULTIMETER', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-MM-003', status: 'in_use' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-001', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-002', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-003', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-004', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-005', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-006', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-007', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-008', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-009', status: 'available' as EquipmentStatus },
    { name: 'Изолента', model: 'TAPE-ELEC', manufacturer: 'ToolPro', categoryName: 'Инструменты', serialNumber: 'TP-TAPE-010', status: 'available' as EquipmentStatus },
    
    // Транспорт
    { name: 'Газель грузовая', model: 'GAZEL-CARGO', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-GAZ-001', status: 'available' as EquipmentStatus },
    { name: 'Газель грузовая', model: 'GAZEL-CARGO', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-GAZ-002', status: 'in_use' as EquipmentStatus },
    { name: 'Газель грузовая', model: 'GAZEL-CARGO', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-GAZ-003', status: 'available' as EquipmentStatus },
    { name: 'Фургон 3.5т', model: 'VAN-3.5T', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-VAN-001', status: 'available' as EquipmentStatus },
    { name: 'Фургон 3.5т', model: 'VAN-3.5T', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-VAN-002', status: 'available' as EquipmentStatus },
    { name: 'Фургон 3.5т', model: 'VAN-3.5T', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-VAN-003', status: 'maintenance' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-001', status: 'available' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-002', status: 'available' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-003', status: 'available' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-004', status: 'available' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-005', status: 'in_use' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-006', status: 'available' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-007', status: 'available' as EquipmentStatus },
    { name: 'Тележка складная', model: 'CART-FOLD', manufacturer: 'TransportCo', categoryName: 'Транспорт', serialNumber: 'TC-CART-008', status: 'available' as EquipmentStatus },
    
    // Безопасность
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-001', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-002', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-003', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-004', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-005', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-006', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-007', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 5л', model: 'FIRE-EXT-5L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE5-008', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 10л', model: 'FIRE-EXT-10L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE10-001', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 10л', model: 'FIRE-EXT-10L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE10-002', status: 'available' as EquipmentStatus },
    { name: 'Огнетушитель 10л', model: 'FIRE-EXT-10L', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FE10-003', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-001', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-002', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-003', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-004', status: 'in_use' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-005', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-006', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-007', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-008', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-009', status: 'available' as EquipmentStatus },
    { name: 'Аптечка первой помощи', model: 'FIRST-AID-KIT', manufacturer: 'SafetyPro', categoryName: 'Безопасность', serialNumber: 'SP-FAK-010', status: 'available' as EquipmentStatus },
  ];

  // Добавляем оборудование
  const now = new Date().toISOString();
  
  // Сначала добавляем оборудование с фиксированными categoryId
  EQUIPMENT_DATA.forEach(eqData => {
    const record: EquipmentRecord = {
      id: 0, // будет установлено репозиторием
      createdAt: now,
      updatedAt: now,
      ...eqData,
    };
    equipmentRepo.create(record);
  });

  // Затем добавляем оборудование для новых категорий (с динамическим определением categoryId)
  additionalEquipment.forEach(eqData => {
    const categoryId = categoryNameToId.get(eqData.categoryName);
    if (!categoryId) {
      console.warn(`Category "${eqData.categoryName}" not found, skipping equipment ${eqData.serialNumber}`);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categoryName: _categoryName, ...rest } = eqData;
    const record: EquipmentRecord = {
      id: 0, // будет установлено репозиторием
      createdAt: now,
      updatedAt: now,
      ...rest,
      categoryId,
    };
    equipmentRepo.create(record);
  });
}
