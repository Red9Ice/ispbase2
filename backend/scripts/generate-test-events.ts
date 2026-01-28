/**
 * @file: generate-test-events.ts
 * @description: Скрипт для генерации 100 тестовых мероприятий с большими описаниями
 * @dependencies: pg
 * @created: 2026-01-28
 */

import { Pool } from 'pg';

// Database connection
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/imlight';

// Парсим connection string
function parseConnectionString(url: string) {
  // Обработка формата postgresql://user@/db?host=/var/run/postgresql
  const unixSocketMatch = url.match(/postgresql:\/\/([^:@]+)@\/([^?]+)\?host=(\/var\/run\/postgresql)/);
  if (unixSocketMatch) {
    return {
      host: '/var/run/postgresql',
      port: 5432,
      database: unixSocketMatch[2] || 'imlight',
      user: unixSocketMatch[1] || 'postgres',
      password: undefined,
      isUnixSocket: true,
    };
  }
  
  try {
    const parsed = new URL(url);
    const hostParam = parsed.searchParams.get('host');
    
    return {
      host: hostParam || parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname?.slice(1) || 'imlight',
      user: parsed.username || 'postgres',
      password: parsed.password || undefined,
      isUnixSocket: hostParam === '/var/run/postgresql',
    };
  } catch {
    return {
      host: 'localhost',
      port: 5432,
      database: 'imlight',
      user: 'postgres',
      password: undefined,
      isUnixSocket: false,
    };
  }
}

const dbConfig = parseConnectionString(dbUrl);

// Проверяем, используется ли Unix socket формат
const useUnixSocket = dbConfig.isUnixSocket || 
                      (dbConfig.host === '/var/run/postgresql') ||
                      (dbConfig.host === 'localhost' && !dbConfig.password && process.platform !== 'win32');

const password = dbConfig.password || process.env.PGPASSWORD || '';

// Для Unix socket используем пользователя из URL или текущего пользователя системы
// Для TCP/IP используем пользователя из URL или postgres
const dbUser = useUnixSocket 
  ? (dbConfig.user || process.env.USER || 'postgres')
  : (dbConfig.user || 'postgres');


const pool = new Pool({
  ...(useUnixSocket ? {
    host: '/var/run/postgresql',
    database: dbConfig.database,
    user: dbUser,
  } : {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbUser,
    password: password || undefined,
  }),
});

// Большие текстовые описания для мероприятий
const eventDescriptions = [
  `Масштабное корпоративное мероприятие с участием более 500 гостей. В программе: торжественное открытие, выступления приглашенных спикеров, интерактивные мастер-классы, networking-сессии, гала-ужин с живой музыкой. Требуется полная техническая поддержка: звуковое оборудование, световое оформление, видеопроекция, сценическое оборудование. Организация кейтеринга на 500 персон с разнообразным меню. Транспортная логистика для доставки оборудования и персонала. Координация работы более 50 сотрудников на площадке.`,
  
  `Международная конференция по инновационным технологиям. Продолжительность мероприятия составляет 10 дней с ежедневной программой с 9:00 до 21:00. Включает в себя: пленарные заседания, панельные дискуссии, воркшопы, выставку технологий, бизнес-завтраки и ужины. Требуется синхронный перевод на 5 языков, видеотрансляция в онлайн-формате, запись всех сессий. Организация проживания для 200 участников из разных стран. Полное техническое оснащение конференц-залов, зон networking, выставочных пространств.`,
  
  `Фестиваль электронной музыки под открытым небом. Трехдневное мероприятие с участием 20+ диджеев и артистов. Установка профессиональной звуковой системы мощностью более 100 кВт, световое шоу с использованием лазеров и LED-экранов, пиротехнические эффекты. Организация фуд-корта с 15 точками питания, барная зона, зона отдыха. Обеспечение безопасности: охрана, медицинская служба, пожарная безопасность. Логистика: доставка и установка оборудования, организация парковки для 500 автомобилей, шаттл-сервис.`,
  
  `Свадебное торжество премиум-класса на 150 гостей. Полная организация мероприятия: от декоративного оформления до финального фейерверка. Включает: церемонию бракосочетания, коктейль-ресепшн, банкет, развлекательную программу с живым оркестром и диджеем, фотозоны, кейтеринг премиум-класса. Транспортная логистика для гостей, организация проживания для иногородних. Видеосъемка и фотосъемка мероприятия. Координация работы 30+ подрядчиков.`,
  
  `Выставка современного искусства с инсталляциями и перформансами. Продолжительность 14 дней. Ежедневная работа с 11:00 до 20:00. Организация выставочных пространств, монтаж инсталляций, обеспечение климат-контроля, охрана экспонатов. Проведение экскурсий, мастер-классов, лекций. Организация пресс-конференции и открытия выставки. Полное техническое оснащение: освещение, звук, проекция. Координация с художниками и кураторами.`,
  
  `Корпоративный тимбилдинг на природе. Двухдневное мероприятие для 80 сотрудников компании. Программа включает: активные игры, квесты, спортивные соревнования, творческие мастер-классы, вечерний костер с барбекю. Организация проживания в палатках или глэмпинге, питание на открытом воздухе, санитарные удобства. Транспортная доставка участников, организация медицинской помощи, страхование участников.`,
  
  `Промо-акция нового продукта в торговом центре. Недельное мероприятие с ежедневной активностью. Установка промо-зоны, организация интерактивных активностей для посетителей, раздача образцов продукции, проведение розыгрышей призов. Работа промоутеров, фотографов, видеографов. Сбор контактных данных участников, организация обратной связи. Ежедневная отчетность по активности и конверсии.`,
  
  `Спортивное соревнование по экстремальным видам спорта. Трехдневное мероприятие с участием 200 спортсменов и 5000 зрителей. Организация трасс и площадок для соревнований, установка трибун, организация питания для участников и зрителей, медицинское обеспечение, судейство, награждение победителей. Трансляция соревнований в онлайн-формате, фото и видеосъемка. Обеспечение безопасности и координация работы волонтеров.`,
  
  `Благотворительный концерт с участием звезд эстрады. Мероприятие на 2000 зрителей. Организация сцены, звукового и светового оборудования, видеопроекции. Продажа билетов, организация VIP-зон, кейтеринг, сувенирная продукция. Сбор пожертвований, организация работы с партнерами и спонсорами. Медиа-поддержка: приглашение журналистов, организация пресс-подхода, трансляция в социальных сетях.`,
  
  `Научно-практическая конференция для специалистов отрасли. Пятидневное мероприятие с участием 300 делегатов. Организация конференц-залов, переговорных комнат, выставочных зон. Техническое оснащение для презентаций, синхронный перевод, видеотрансляция. Организация кофе-брейков, обедов, ужинов. Издание сборника материалов конференции. Организация экскурсионной программы для иногородних участников.`,
];

const eventTitles = [
  'Корпоративный форум 2026',
  'Международная конференция по инновациям',
  'Фестиваль электронной музыки',
  'Свадебное торжество премиум-класса',
  'Выставка современного искусства',
  'Корпоративный тимбилдинг',
  'Промо-акция нового продукта',
  'Спортивное соревнование',
  'Благотворительный концерт',
  'Научно-практическая конференция',
  'Джазовый фестиваль',
  'Театральный фестиваль',
  'Кинофестиваль',
  'Гастрономический фестиваль',
  'Фестиваль уличного искусства',
  'Рок-концерт под открытым небом',
  'Классический концерт в филармонии',
  'Балетный спектакль',
  'Опера в историческом театре',
  'Цирковое представление',
];

const statuses: Array<'draft' | 'request' | 'in_work' | 'completed' | 'canceled'> = [
  'draft',
  'request',
  'in_work',
  'completed',
  'canceled',
];

// Генерация большого описания
function generateLargeDescription(baseDescription: string, index: number): string {
  const additionalTexts = [
    ` Дополнительные детали мероприятия: координация работы множества подрядчиков, обеспечение бесперебойной работы всех систем, организация обратной связи с участниками, сбор статистики и аналитики, подготовка отчетной документации.`,
    ` Важные аспекты организации: соблюдение всех норм безопасности, экологические требования, доступность для людей с ограниченными возможностями, организация парковки и транспортной логистики, координация с местными властями и службами.`,
    ` Технические требования: резервное питание, система видеонаблюдения, система контроля доступа, организация Wi-Fi для участников, мобильное приложение для навигации, система онлайн-регистрации и билетинга.`,
    ` Маркетинговое сопровождение: продвижение в социальных сетях, работа с блогерами и инфлюенсерами, организация пресс-конференций, выпуск пресс-релизов, создание промо-материалов, организация фото и видеосъемки.`,
    ` Логистические задачи: доставка оборудования и материалов, организация складских помещений, координация работы грузчиков и монтажников, организация вывоза оборудования после мероприятия, утилизация отходов.`,
  ];
  
  let description = baseDescription;
  // Добавляем дополнительные тексты для увеличения размера
  for (let i = 0; i < 3 + (index % 3); i++) {
    description += additionalTexts[index % additionalTexts.length];
  }
  
  // Добавляем детали по индексу для уникальности
  description += ` Мероприятие номер ${index + 1} в серии. Уникальный идентификатор: ${Date.now()}-${index}. Дополнительная информация о планировании, бюджетировании и координации всех аспектов мероприятия.`;
  
  return description;
}

// Генерация даты в диапазоне 2025-2026 годов
function generateDateInRange(year: number, dayOfYear: number): Date {
  const date = new Date(year, 0, 1); // 1 января указанного года
  date.setDate(date.getDate() + dayOfYear - 1); // Добавляем дни года (dayOfYear от 1 до 365/366)
  return date;
}

// Генерация продолжительности события (10-20 дней)
function generateEventDates(index: number, total: number): { startDate: Date; endDate: Date } {
  // Равномерно распределяем мероприятия по 2025-2026 годам
  // 2025 год: 365 дней, 2026 год: 365 дней (пока не високосный), всего ~730 дней
  const totalDays = 365 + 365; // 730 дней на два года
  const daysPerEvent = totalDays / total; // Интервал между началами мероприятий
  const startDayOfPeriod = Math.floor(index * daysPerEvent) + 1; // Начало в днях от 1 января 2025
  
  // Определяем год и день года
  let year = 2025;
  let dayOfYear = startDayOfPeriod;
  
  if (dayOfYear > 365) {
    year = 2026;
    dayOfYear = dayOfYear - 365;
  }
  
  // Добавляем небольшую случайность для более естественного распределения
  const randomOffset = Math.floor(Math.random() * (daysPerEvent * 0.3)); // До 30% от интервала
  dayOfYear = Math.max(1, Math.min(dayOfYear + randomOffset, year === 2025 ? 365 : 365));
  
  // Если вышли за пределы 2025 года, переходим в 2026
  if (year === 2025 && dayOfYear > 365) {
    year = 2026;
    dayOfYear = dayOfYear - 365;
  }
  
  const startDate = generateDateInRange(year, dayOfYear);
  
  // Продолжительность от 10 до 20 дней
  const duration = 10 + Math.floor(Math.random() * 11); // 10-20 дней
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);
  
  // Проверяем, что не выходим за пределы 2026 года
  if (endDate.getFullYear() > 2026 || (endDate.getFullYear() === 2026 && endDate.getMonth() === 11 && endDate.getDate() > 31)) {
    // Если выходим за пределы, корректируем дату окончания
    endDate.setFullYear(2026, 11, 31); // 31 декабря 2026
    // И корректируем дату начала, чтобы продолжительность была в пределах 10-20 дней
    const maxStartDate = new Date(endDate);
    maxStartDate.setDate(maxStartDate.getDate() - 10);
    if (startDate > maxStartDate) {
      startDate.setTime(maxStartDate.getTime());
    }
  }
  
  return { startDate, endDate };
}

async function generateTestEvents() {
  // Количество мероприятий для генерации (можно задать через переменную окружения)
  const eventsCount = parseInt(process.env.EVENTS_COUNT || '400', 10);
  
  try {
    const client = await pool.connect();
    
    try {
      // Получаем существующие client_id и venue_id
      let clientsResult = await client.query('SELECT id FROM client ORDER BY id LIMIT 1000');
      let venuesResult = await client.query('SELECT id FROM venue ORDER BY id LIMIT 1000');
      
      let clientIds = clientsResult.rows.map(row => row.id);
      let venueIds = venuesResult.rows.map(row => row.id);
      
      // Если нет клиентов, создаем тестовых
      if (clientIds.length === 0) {
        console.log('Создаю тестовых клиентов...');
        const testClients = [
          { name: 'ООО "Тестовый Клиент 1"', type: 'company', email: 'client1@test.com', phone: '+7 (999) 111-11-11' },
          { name: 'Иванов Иван Иванович', type: 'person', email: 'client2@test.com', phone: '+7 (999) 222-22-22' },
          { name: 'ООО "Тестовый Клиент 2"', type: 'company', email: 'client3@test.com', phone: '+7 (999) 333-33-33' },
          { name: 'Петров Петр Петрович', type: 'person', email: 'client4@test.com', phone: '+7 (999) 444-44-44' },
          { name: 'ООО "Тестовый Клиент 3"', type: 'company', email: 'client5@test.com', phone: '+7 (999) 555-55-55' },
        ];
        
        for (const testClient of testClients) {
          const result = await client.query(
            'INSERT INTO client (name, type, email, phone, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
            [testClient.name, testClient.type, testClient.email, testClient.phone]
          );
          clientIds.push(result.rows[0].id);
        }
        console.log(`Создано ${clientIds.length} тестовых клиентов`);
      }
      
      // Если нет площадок, создаем тестовые
      if (venueIds.length === 0) {
        console.log('Создаю тестовые площадки...');
        const testVenues = [
          { name: 'Концертный зал "Тестовая Площадка 1"', address: 'г. Москва, ул. Тестовая, д. 1', capacity: 500 },
          { name: 'Конференц-центр "Тестовая Площадка 2"', address: 'г. Санкт-Петербург, пр. Тестовый, д. 2', capacity: 300 },
          { name: 'Выставочный центр "Тестовая Площадка 3"', address: 'г. Екатеринбург, ул. Тестовая, д. 3', capacity: 1000 },
          { name: 'Театр "Тестовая Площадка 4"', address: 'г. Новосибирск, ул. Тестовая, д. 4', capacity: 400 },
          { name: 'Стадион "Тестовая Площадка 5"', address: 'г. Казань, ул. Тестовая, д. 5', capacity: 5000 },
        ];
        
        for (const testVenue of testVenues) {
          const result = await client.query(
            'INSERT INTO venue (name, address, capacity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
            [testVenue.name, testVenue.address, testVenue.capacity]
          );
          venueIds.push(result.rows[0].id);
        }
        console.log(`Создано ${venueIds.length} тестовых площадок`);
      }
      
      console.log(`Найдено клиентов: ${clientIds.length}, площадок: ${venueIds.length}`);
      
      // Не удаляем старые мероприятия, добавляем новые к существующим
      // Считаем, сколько уже есть тестовых мероприятий
      const existingCountResult = await client.query(
        `SELECT COUNT(*) as count FROM event WHERE description LIKE '%Уникальный идентификатор:%'`
      );
      const existingCount = parseInt(existingCountResult.rows[0].count || '0', 10);
      
      console.log(`Найдено существующих тестовых мероприятий: ${existingCount}`);
      console.log(`Начинаю генерацию ${eventsCount} новых мероприятий на 2025-2026 годы...`);
      
      await client.query('BEGIN');
      
      let generated = 0;
      const errors: string[] = [];
      
      // Начинаем с индекса, равного количеству существующих мероприятий
      for (let i = existingCount; i < existingCount + eventsCount; i++) {
        try {
          // Общее количество мероприятий для равномерного распределения
          const totalEvents = existingCount + eventsCount;
          const { startDate, endDate } = generateEventDates(i, totalEvents);
          const titleIndex = i % eventTitles.length;
          const title = `${eventTitles[titleIndex]} #${i + 1}`;
          const descriptionIndex = i % eventDescriptions.length;
          const description = generateLargeDescription(eventDescriptions[descriptionIndex], i);
          const status = statuses[i % statuses.length];
          const clientId = clientIds[i % clientIds.length];
          const venueId = venueIds[i % venueIds.length];
          const budgetPlanned = 100000 + Math.random() * 900000; // 100k - 1M
          const budgetActual = budgetPlanned * (0.7 + Math.random() * 0.3); // 70-100% от запланированного
          
          await client.query(
            `INSERT INTO event (title, description, start_date, end_date, status, contract_price, budget_actual, client_id, venue_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
              title,
              description,
              startDate.toISOString(),
              endDate.toISOString(),
              status,
              Math.round(budgetPlanned * 100) / 100,
              Math.round(budgetActual * 100) / 100,
              clientId,
              venueId,
            ]
          );
          
          generated++;
          if (generated % 50 === 0) {
            console.log(`Сгенерировано ${generated} новых мероприятий...`);
          }
        } catch (error) {
          errors.push(`Ошибка при создании мероприятия #${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      await client.query('COMMIT');
      
      console.log(`\nГенерация завершена:`);
      console.log(`  - Создано новых мероприятий: ${generated}`);
      console.log(`  - Всего тестовых мероприятий в базе: ${existingCount + generated}`);
      if (errors.length > 0) {
        console.log(`  - Ошибок: ${errors.length}`);
        errors.forEach(err => console.error(`    ${err}`));
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка генерации:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запуск генерации
generateTestEvents();
