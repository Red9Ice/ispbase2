/**
 * @file: staff.dto.ts
 * @description: Draft DTOs for staff.
 * @dependencies: none
 * @created: 2026-01-26
 */

export type StaffStatus = 'active' | 'inactive';

export interface StaffDto {
  id?: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  rate?: number;
  currency: 'RUB';
  status: StaffStatus;
  
  // Рейтинг
  rating?: number;
  ratingComment?: string;
  
  // О персонале
  city?: string;
  profile?: string; // Роли через "/"
  employmentType?: string; // По найму
  otherPaymentMethods?: string; // Другие способы оплаты
  
  // Документы
  passportSeries?: string;
  passportNumber?: string;
  passportIssuedBy?: string;
  passportIssueDate?: string;
  passportDepartmentCode?: string;
  passportScanUrl?: string;
  snils?: string;
  inn?: string;
  birthDate?: string;
  birthPlace?: string;
  registrationAddress?: string;
  
  createdAt?: string;
  updatedAt?: string;
}
