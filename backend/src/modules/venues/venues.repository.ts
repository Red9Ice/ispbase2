/**
 * @file: venues.repository.ts
 * @description: In-memory repository for venues.
 * @dependencies: none
 * @created: 2026-01-26
 */

export interface VenueRecord {
  id: number;
  name: string;
  address?: string;
  capacity?: number;
  contactName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export class VenuesRepository {
  private readonly items: VenueRecord[] = [
    { id: 1, name: 'Arena', address: 'Москва, ул. Спортивная, 1', capacity: 5000, contactName: 'Дмитрий Волков', phone: '+7 999 111-22-33', createdAt: '2025-09-01T09:00:00Z', updatedAt: '2025-09-01T09:00:00Z' },
    { id: 2, name: 'Open Air', address: 'Москва, парк Горького', capacity: 10000, contactName: 'Елена Смирнова', phone: '+7 999 222-33-44', createdAt: '2025-09-05T10:00:00Z', updatedAt: '2025-09-05T10:00:00Z' },
    { id: 3, name: 'Studio 3', address: 'Москва, ул. Студийная, 3', capacity: 200, contactName: 'Сергей Иванов', phone: '+7 999 333-44-55', createdAt: '2025-09-10T11:00:00Z', updatedAt: '2025-09-10T11:00:00Z' },
    { id: 4, name: 'Концертный зал "Звезда"', address: 'Москва, пр. Мира, 150', capacity: 3000, contactName: 'Анна Петрова', phone: '+7 999 444-55-66', createdAt: '2025-10-15T08:00:00Z', updatedAt: '2025-10-15T08:00:00Z' },
    { id: 5, name: 'Клуб "Энергия"', address: 'Москва, ул. Ленина, 25', capacity: 800, contactName: 'Михаил Соколов', phone: '+7 999 555-66-77', createdAt: '2025-11-20T12:00:00Z', updatedAt: '2025-11-20T12:00:00Z' },
    { id: 6, name: 'Дворец культуры "Москва"', address: 'Москва, ул. Тверская, 10', capacity: 2500, contactName: 'Ольга Новикова', phone: '+7 999 666-77-88', createdAt: '2025-09-20T09:00:00Z', updatedAt: '2025-09-20T09:00:00Z' },
    { id: 7, name: 'Концертный зал "Космос"', address: 'Москва, пр. Мира, 111', capacity: 4000, contactName: 'Александр Федоров', phone: '+7 999 777-88-99', createdAt: '2025-10-05T10:00:00Z', updatedAt: '2025-10-05T10:00:00Z' },
    { id: 8, name: 'Студия "Звукозапись"', address: 'Москва, ул. Арбат, 35', capacity: 150, contactName: 'Виктор Белов', phone: '+7 999 888-99-00', createdAt: '2025-09-15T08:00:00Z', updatedAt: '2025-12-10T14:00:00Z' },
    { id: 9, name: 'Театр "Современник"', address: 'Москва, ул. Чистопрудный бульвар, 19', capacity: 1200, contactName: 'Наталья Семенова', phone: '+7 999 999-00-11', createdAt: '2025-10-20T09:00:00Z', updatedAt: '2025-10-20T09:00:00Z' },
    { id: 10, name: 'Клуб "Джаз"', address: 'Москва, ул. Пятницкая, 27', capacity: 300, contactName: 'Максим Козлов', phone: '+7 999 000-11-22', createdAt: '2025-11-10T10:00:00Z', updatedAt: '2025-11-10T10:00:00Z' },
    { id: 11, name: 'Концертная площадка "Лужники"', address: 'Москва, Лужнецкая наб., 24', capacity: 15000, contactName: 'Татьяна Морозова', phone: '+7 999 111-22-33', createdAt: '2025-08-25T08:00:00Z', updatedAt: '2025-12-15T15:00:00Z' },
    { id: 12, name: 'Студия "Видео Продакшн"', address: 'Москва, ул. Красная Пресня, 28', capacity: 100, contactName: 'Андрей Волков', phone: '+7 999 222-33-44', createdAt: '2025-10-30T09:00:00Z', updatedAt: '2025-10-30T09:00:00Z' },
    { id: 13, name: 'Культурный центр "Октябрь"', address: 'Москва, ул. Новый Арбат, 21', capacity: 1800, contactName: 'Екатерина Соколова', phone: '+7 999 333-44-55', createdAt: '2025-11-20T11:00:00Z', updatedAt: '2025-11-20T11:00:00Z' },
    { id: 14, name: 'Клуб "Рок-Сити"', address: 'Москва, ул. Садовая-Кудринская, 5', capacity: 600, contactName: 'Роман Петров', phone: '+7 999 444-55-66', createdAt: '2025-12-05T10:00:00Z', updatedAt: '2025-12-05T10:00:00Z' },
    { id: 15, name: 'Концертный зал "Филармония"', address: 'Москва, Тверская ул., 31', capacity: 2000, contactName: 'Ирина Новикова', phone: '+7 999 555-66-77', createdAt: '2025-09-30T08:00:00Z', updatedAt: '2025-12-20T16:00:00Z' },
    { id: 16, name: 'Студия "Аудио"', address: 'Москва, ул. Большая Дмитровка, 15', capacity: 120, contactName: 'Денис Федоров', phone: '+7 999 666-77-88', createdAt: '2025-10-15T09:00:00Z', updatedAt: '2025-10-15T09:00:00Z' },
    { id: 17, name: 'Дворец спорта "Олимпийский"', address: 'Москва, Олимпийский пр-т, 16', capacity: 20000, contactName: 'Светлана Иванова', phone: '+7 999 777-88-99', createdAt: '2025-08-20T08:00:00Z', updatedAt: '2025-12-10T14:00:00Z' },
    { id: 18, name: 'Клуб "Блюз"', address: 'Москва, ул. Покровка, 40', capacity: 250, contactName: 'Владимир Смирнов', phone: '+7 999 888-99-00', createdAt: '2025-11-15T10:00:00Z', updatedAt: '2025-11-15T10:00:00Z' },
    { id: 19, name: 'Концертная площадка "Сокольники"', address: 'Москва, Сокольнический Вал, 1', capacity: 8000, contactName: 'Оксана Кузнецова', phone: '+7 999 999-00-11', createdAt: '2025-10-25T09:00:00Z', updatedAt: '2025-10-25T09:00:00Z' },
    { id: 20, name: 'Студия "Свет"', address: 'Москва, ул. Тверская-Ямская, 2', capacity: 80, contactName: 'Алексей Попов', phone: '+7 999 000-11-22', createdAt: '2025-12-10T11:00:00Z', updatedAt: '2025-12-10T11:00:00Z' },
  ];
  private seq = 21;

  list(): VenueRecord[] {
    return [...this.items];
  }

  getById(id: number): VenueRecord | undefined {
    return this.items.find((item) => item.id === id);
  }
}
