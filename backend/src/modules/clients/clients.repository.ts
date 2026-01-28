/**
 * @file: clients.repository.ts
 * @description: In-memory repository for clients.
 * @dependencies: none
 * @created: 2026-01-26
 */

export interface ClientRecord {
  id: number;
  name: string;
  type: 'company' | 'person';
  contactName?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export class ClientsRepository {
  private readonly items: ClientRecord[] = [
    { id: 1, name: 'ООО "Концерты Плюс"', type: 'company', contactName: 'Иван Петров', email: 'ivan@concerts.ru', phone: '+7 999 123-45-67', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
    { id: 2, name: 'Мария Сидорова', type: 'person', email: 'maria@example.com', phone: '+7 999 234-56-78', createdAt: '2025-10-05T10:00:00Z', updatedAt: '2025-10-05T10:00:00Z' },
    { id: 3, name: 'АО "События"', type: 'company', contactName: 'Алексей Козлов', email: 'alex@events.ru', phone: '+7 999 345-67-89', createdAt: '2025-10-10T11:00:00Z', updatedAt: '2025-10-10T11:00:00Z' },
    { id: 4, name: 'ИП Смирнов Андрей', type: 'person', contactName: 'Андрей Смирнов', email: 'andrey.smirnov@mail.ru', phone: '+7 999 456-78-90', createdAt: '2025-11-15T12:00:00Z', updatedAt: '2025-11-15T12:00:00Z' },
    { id: 5, name: 'ООО "Медиа Групп"', type: 'company', contactName: 'Екатерина Орлова', email: 'ekaterina@mediagroup.ru', phone: '+7 999 567-89-01', createdAt: '2025-12-01T08:00:00Z', updatedAt: '2025-12-01T08:00:00Z' },
    { id: 6, name: 'ООО "Арт Проджект"', type: 'company', contactName: 'Михаил Степанов', email: 'mikhail@artproject.ru', phone: '+7 999 678-90-12', createdAt: '2025-10-20T09:00:00Z', updatedAt: '2025-10-20T09:00:00Z' },
    { id: 7, name: 'ИП Ковалев Сергей', type: 'person', contactName: 'Сергей Ковалев', email: 'sergey.kovalev@mail.ru', phone: '+7 999 789-01-23', createdAt: '2025-11-10T10:00:00Z', updatedAt: '2025-11-10T10:00:00Z' },
    { id: 8, name: 'АО "Концертное агентство"', type: 'company', contactName: 'Анна Федорова', email: 'anna@concert-agency.ru', phone: '+7 999 890-12-34', createdAt: '2025-09-15T08:00:00Z', updatedAt: '2025-12-10T14:00:00Z' },
    { id: 9, name: 'ООО "Студия Звук"', type: 'company', contactName: 'Дмитрий Новиков', email: 'dmitry@studio-zvuk.ru', phone: '+7 999 901-23-45', createdAt: '2025-10-25T09:00:00Z', updatedAt: '2025-10-25T09:00:00Z' },
    { id: 10, name: 'ИП Орлова Мария', type: 'person', contactName: 'Мария Орлова', email: 'maria.orlova@gmail.com', phone: '+7 999 012-34-56', createdAt: '2025-11-20T11:00:00Z', updatedAt: '2025-11-20T11:00:00Z' },
    { id: 11, name: 'ООО "Эвент Менеджмент"', type: 'company', contactName: 'Владимир Петров', email: 'vladimir@event-mgmt.ru', phone: '+7 999 123-45-67', createdAt: '2025-09-10T08:00:00Z', updatedAt: '2025-12-15T15:00:00Z' },
    { id: 12, name: 'АО "Медиа Холдинг"', type: 'company', contactName: 'Елена Соколова', email: 'elena@media-holding.ru', phone: '+7 999 234-56-78', createdAt: '2025-10-30T09:00:00Z', updatedAt: '2025-10-30T09:00:00Z' },
    { id: 13, name: 'ИП Волков Андрей', type: 'person', contactName: 'Андрей Волков', email: 'andrey.volkov@yandex.ru', phone: '+7 999 345-67-89', createdAt: '2025-12-05T10:00:00Z', updatedAt: '2025-12-05T10:00:00Z' },
    { id: 14, name: 'ООО "Праздник Про"', type: 'company', contactName: 'Татьяна Морозова', email: 'tatyana@prazdnik-pro.ru', phone: '+7 999 456-78-90', createdAt: '2025-11-15T09:00:00Z', updatedAt: '2025-11-15T09:00:00Z' },
    { id: 15, name: 'АО "Культурные События"', type: 'company', contactName: 'Игорь Белов', email: 'igor@cultural-events.ru', phone: '+7 999 567-89-01', createdAt: '2025-09-25T08:00:00Z', updatedAt: '2025-12-20T16:00:00Z' },
    { id: 16, name: 'ИП Семенова Наталья', type: 'person', contactName: 'Наталья Семенова', email: 'natalya.semenova@mail.ru', phone: '+7 999 678-90-12', createdAt: '2025-12-10T11:00:00Z', updatedAt: '2025-12-10T11:00:00Z' },
    { id: 17, name: 'ООО "Шоу Технологии"', type: 'company', contactName: 'Максим Козлов', email: 'maxim@show-tech.ru', phone: '+7 999 789-01-23', createdAt: '2025-10-15T09:00:00Z', updatedAt: '2025-10-15T09:00:00Z' },
    { id: 18, name: 'АО "Музыкальный Мир"', type: 'company', contactName: 'Оксана Кузнецова', email: 'oksana@music-world.ru', phone: '+7 999 890-12-34', createdAt: '2025-11-05T10:00:00Z', updatedAt: '2026-01-12T13:00:00Z' },
    { id: 19, name: 'ИП Попов Алексей', type: 'person', contactName: 'Алексей Попов', email: 'alexey.popov@gmail.com', phone: '+7 999 901-23-45', createdAt: '2025-12-18T11:00:00Z', updatedAt: '2025-12-18T11:00:00Z' },
    { id: 20, name: 'ООО "Арт Студия"', type: 'company', contactName: 'Светлана Иванова', email: 'svetlana@art-studio.ru', phone: '+7 999 012-34-56', createdAt: '2025-10-10T08:00:00Z', updatedAt: '2025-12-25T15:00:00Z' },
  ];
  private seq = 21;

  list(): ClientRecord[] {
    return [...this.items];
  }

  getById(id: number): ClientRecord | undefined {
    return this.items.find((item) => item.id === id);
  }
}
