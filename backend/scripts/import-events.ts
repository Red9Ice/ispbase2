/**
 * @file: import-events.ts
 * @description: Script to import events from CSV file (.ispdata) to PostgreSQL database
 * @dependencies: pg, fs
 * @created: 2026-01-27
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// Database connection
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/imlight';

// Парсим connection string
function parseConnectionString(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname?.slice(1) || 'imlight',
      user: parsed.username || 'postgres',
      password: parsed.password || undefined,
    };
  } catch {
    // Если не удалось распарсить, используем значения по умолчанию
    return {
      host: 'localhost',
      port: 5432,
      database: 'imlight',
      user: 'postgres',
      password: undefined,
    };
  }
}

const dbConfig = parseConnectionString(dbUrl);

// Используем PGPASSWORD из окружения, если он есть
const password = dbConfig.password || process.env.PGPASSWORD || '';

// Пробуем использовать peer authentication через Unix socket, если host = localhost и нет пароля
const useUnixSocket = dbConfig.host === 'localhost' && !password && process.platform !== 'win32';

// Если используется Unix socket без указания пользователя, пробуем postgres
const dbUser = useUnixSocket && !dbConfig.user ? 'postgres' : dbConfig.user;

const pool = new Pool({
  ...(useUnixSocket ? {
    // Peer authentication через Unix socket
    host: '/var/run/postgresql',
    database: dbConfig.database,
    user: dbUser, // Пробуем postgres для peer auth
  } : {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbUser,
    password: password, // Всегда передаем строку (может быть пустой)
  }),
});

interface CSVRow {
  event_id: string;
  start_date: string;
  end_date: string;
  folder_name: string;
  status: string;
  comment: string;
  manager: string;
  client_contact: string;
  kp: string;
  rr: string;
  chat: string;
  trucks: string;
  foreman: string;
  opm: string;
  opm_scan: string;
  city: string;
  venue: string;
  yandex_disk_url: string;
  email: string;
  contract_price: string;
  actual_expenses: string;
  margin: string;
  our_legal_entity: string;
  payment: string;
  debt: string;
  finance_comment: string;
  client_legal_entity: string;
  last_modified: string;
  venue_address: string;
  merged_with: string;
  save_personnel_pdf: string;
}

// Map status from CSV to database status
function mapStatus(csvStatus: string): 'draft' | 'request' | 'in_work' | 'completed' | 'canceled' {
  const statusMap: Record<string, 'draft' | 'request' | 'in_work' | 'completed' | 'canceled'> = {
    'Состоялось': 'completed',
    'Отменилось': 'canceled',
    'Объединено': 'completed',
    'Событие': 'completed',
  };
  return statusMap[csvStatus] || 'draft';
}

// Parse date from DD.MM.YYYY format
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

// Parse number from Russian format (with spaces and comma)
function parseNumber(numStr: string): number {
  if (!numStr || numStr.trim() === '') return 0;
  // Remove spaces and replace comma with dot
  const cleaned = numStr.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Extract name and phone from contact string
function parseContact(contactStr: string): { name?: string; phone?: string } {
  if (!contactStr || contactStr.trim() === '') return {};
  // Try to extract phone number (format: +7 XXX XXX-XX-XX or similar)
  const phoneMatch = contactStr.match(/\+?\d[\d\s\-()]{7,}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : undefined;
  // Name is everything before phone
  const name = phone ? contactStr.substring(0, phoneMatch!.index).trim().replace(/,$/, '') : contactStr.trim();
  return { name: name || undefined, phone };
}

// Simple CSV parser (handles quoted fields and multiline)
function parseCSV(content: string): CSVRow[] {
  // Разбиваем на строки с учетом кавычек
  const csvRows: string[] = [];
  let currentRow = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentRow += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        currentRow += char;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentRow.trim()) {
        csvRows.push(currentRow);
      }
      currentRow = '';
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) csvRows.push(currentRow);

  // Находим первую строку с данными (начинается с M_)
  let dataStartIndex = 0;
  
  for (let i = 0; i < csvRows.length; i++) {
    if (csvRows[i].trim().startsWith('M_')) {
      dataStartIndex = i;
      break;
    }
  }
  
  // Заголовок - все строки до первой строки данных
  // Объединяем их, заменяя переносы строк на пробелы внутри кавычек
  let headerText = '';
  inQuotes = false;
  
  for (let i = 0; i < dataStartIndex; i++) {
    const row = csvRows[i];
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
        headerText += char;
      } else if (char === '\n' && inQuotes) {
        headerText += ' '; // Заменяем перенос строки на пробел внутри кавычек
      } else if (char !== '\n' || inQuotes) {
        headerText += char;
      }
    }
  }
  
  const headers = parseCSVLine(headerText);
  
  console.log(`Найдено заголовков: ${headers.length}, начало данных: строка ${dataStartIndex}, всего строк: ${csvRows.length}`);
  
  // Если заголовок не найден, используем фиксированный список
  if (headers.length === 0 || dataStartIndex === 0) {
    console.warn('Не удалось распарсить заголовок');
    return [];
  }

  // Map headers to our interface
  const headerMap: Record<string, keyof CSVRow> = {
    'event_id': 'event_id',
    'Дата\nначала мероприятия': 'start_date',
    'Дата\nокончания\nмероприятия': 'end_date',
    'Название папки на Яндекс Диске': 'folder_name',
    'Статус': 'status',
    'Комментарий': 'comment',
    'Менеджер': 'manager',
    'Контакт заказчика': 'client_contact',
    'КП': 'kp',
    'RR': 'rr',
    'Чат': 'chat',
    'Фуры': 'trucks',
    'Бригадир': 'foreman',
    'ОПМ': 'opm',
    'ОПМ Скан': 'opm_scan',
    'Город': 'city',
    'Место': 'venue',
    'Ссылка на Яндекс Диск': 'yandex_disk_url',
    'Email': 'email',
    'Цена контракта': 'contract_price',
    'Расходы\nфакт': 'actual_expenses',
    'Маржинальность по факту': 'margin',
    'ЮРЛИЦО\nот нас': 'our_legal_entity',
    'Оплата': 'payment',
    'Долг': 'debt',
    'Комментарий финансы': 'finance_comment',
    'ЮРЛИЦО\nзаказчика': 'client_legal_entity',
    'Последнее изменение': 'last_modified',
    'Адрес места проведения': 'venue_address',
    'Объединено с мероприятием': 'merged_with',
    'Сохранение персонала в PDF': 'save_personnel_pdf',
  };

  const rows: CSVRow[] = [];
  // Начинаем с строки после заголовка
  for (let i = dataStartIndex; i < csvRows.length; i++) {
    const values = parseCSVLine(csvRows[i]);
    if (values.length === 0 || !values[0] || values[0].trim() === '') continue;

    const row: Partial<CSVRow> = {};
    headers.forEach((header, index) => {
      const key = headerMap[header];
      if (key && values[index] !== undefined) {
        row[key] = values[index];
      }
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

function parseCSVLine(line: string | undefined): string[] {
  if (!line || line.trim() === '') {
    return [];
  }
  
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);

  return fields.map(f => f.trim());
}

async function importEvents() {
  try {
    console.log('Начинаю импорт мероприятий из CSV...');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../.ispdata');
    const csvPathAlt = path.join(process.cwd(), '.ispdata');
    const finalPath = fs.existsSync(csvPath) ? csvPath : csvPathAlt;
    
    if (!fs.existsSync(finalPath)) {
      throw new Error(`Файл не найден. Проверены пути: ${csvPath}, ${csvPathAlt}`);
    }
    
    console.log(`Используется файл: ${finalPath}`);
    
    // Проверяем размер файла
    const stats = fs.statSync(finalPath);
    console.log(`Размер файла: ${stats.size} байт`);
    
    if (stats.size === 0) {
      throw new Error('Файл пуст! Убедитесь, что файл сохранен на диск.');
    }

    const csvContent = fs.readFileSync(finalPath, 'utf-8');
    console.log(`Прочитано ${csvContent.length} символов из файла`);
    
    // Используем библиотеку csv-parse для правильной обработки многострочных полей
    let records: any[] = [];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
        bom: true,
        skip_records_with_error: true,
      }) as any[];
    } catch (error) {
      console.error('Ошибка парсинга CSV:', error);
      // Попробуем без headers
      const rawRecords = parse(csvContent, {
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      }) as any[][];
      
      if (rawRecords.length > 0) {
        // Первая строка - заголовки
        const headers = rawRecords[0];
        // Остальные - данные
        records = rawRecords.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
      }
    }
    
    console.log(`Прочитано ${records.length} строк из CSV`);
    if (records.length > 0) {
      console.log(`Первая запись:`, Object.keys(records[0]));
    }
    
    // Преобразуем в наш формат
    const rows: CSVRow[] = records.map((record) => {
      const row: Partial<CSVRow> = {};
      // Маппинг полей
      row.event_id = record.event_id || '';
      row.start_date = record['Дата\nначала мероприятия'] || record['Дата начала мероприятия'] || '';
      row.end_date = record['Дата\nокончания\nмероприятия'] || record['Дата окончания мероприятия'] || '';
      row.folder_name = record['Название папки на Яндекс Диске'] || '';
      row.status = record['Статус'] || '';
      row.comment = record['Комментарий'] || '';
      row.manager = record['Менеджер'] || '';
      row.client_contact = record['Контакт заказчика'] || '';
      row.kp = record['КП'] || '';
      row.rr = record['RR'] || '';
      row.chat = record['Чат'] || '';
      row.trucks = record['Фуры'] || '';
      row.foreman = record['Бригадир'] || '';
      row.opm = record['ОПМ'] || '';
      row.opm_scan = record['ОПМ Скан'] || '';
      row.city = record['Город'] || '';
      row.venue = record['Место'] || '';
      row.yandex_disk_url = record['Ссылка на Яндекс Диск'] || '';
      row.email = record['Email'] || '';
      row.contract_price = record['Цена контракта'] || '';
      row.actual_expenses = record['Расходы\nфакт'] || record['Расходы факт'] || '';
      row.margin = record['Маржинальность по факту'] || '';
      row.our_legal_entity = record['ЮРЛИЦО\nот нас'] || record['ЮРЛИЦО от нас'] || '';
      row.payment = record['Оплата'] || '';
      row.debt = record['Долг'] || '';
      row.finance_comment = record['Комментарий финансы'] || '';
      row.client_legal_entity = record['ЮРЛИЦО\nзаказчика'] || record['ЮРЛИЦО заказчика'] || '';
      row.last_modified = record['Последнее изменение'] || '';
      row.venue_address = record['Адрес места проведения'] || '';
      row.merged_with = record['Объединено с мероприятием'] || '';
      row.save_personnel_pdf = record['Сохранение персонала в PDF'] || '';
      return row as CSVRow;
    });

    // Test database connection
    try {
      await pool.query('SELECT 1');
      console.log('Подключение к базе данных установлено');
    } catch (error: any) {
      if (error.code === '3D000' || error.message?.includes('does not exist')) {
        console.error('❌ База данных не существует!');
        console.error('Создайте базу данных командой:');
        console.error('  sudo -u postgres psql -c "CREATE DATABASE imlight;"');
        console.error('  sudo -u postgres psql -d imlight -f docs/migrations/001_init.sql');
        throw error;
      } else if (error.code === '28000' || error.message?.includes('password') || error.message?.includes('authentication')) {
        console.error('❌ Ошибка аутентификации!');
        console.error('Укажите пароль через переменную окружения:');
        console.error('  export PGPASSWORD="ваш_пароль"');
        console.error('Или в DATABASE_URL:');
        console.error('  export DATABASE_URL="postgres://postgres:пароль@localhost:5432/imlight"');
        throw error;
      }
      throw error;
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Maps to track existing entities
      const clientMap = new Map<string, number>(); // email -> client_id
      const venueMap = new Map<string, number>(); // city+venue -> venue_id

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const row of rows) {
        try {
          // Skip rows without essential data
          if (!row.event_id || !row.start_date || !row.end_date) {
            skipped++;
            continue;
          }

          // Parse dates
          const startDate = parseDate(row.start_date);
          const endDate = parseDate(row.end_date);
          if (!startDate || !endDate) {
            console.warn(`Пропущено мероприятие ${row.event_id}: неверный формат даты`);
            skipped++;
            continue;
          }

          // Get or create client
          let clientId: number;
          const clientEmail = row.email?.trim() || '';
          const clientContact = row.client_contact?.trim() || '';
          const clientLegalEntity = row.client_legal_entity?.trim() || '';

          // Create a unique key for client lookup
          const clientKey = clientEmail || `${clientLegalEntity}|${clientContact}` || `unknown_${row.event_id}`;

          if (clientMap.has(clientKey)) {
            clientId = clientMap.get(clientKey)!;
          } else {
            // Create client
            const contactInfo = parseContact(clientContact);
            const clientName = clientLegalEntity || contactInfo.name || clientEmail || `Клиент ${row.event_id}`;
            const clientType = clientLegalEntity ? 'company' : 'person';

            let clientResult;
            if (clientEmail) {
              // Try to get existing client by email first
              const existingClient = await client.query(
                'SELECT id FROM client WHERE email = $1',
                [clientEmail]
              );
              
              if (existingClient.rows.length > 0) {
                clientId = existingClient.rows[0].id;
              } else {
                // Insert new client
                clientResult = await client.query(
                  `INSERT INTO client (name, type, contact_name, email, phone, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                   RETURNING id`,
                  [clientName, clientType, contactInfo.name || null, clientEmail, contactInfo.phone || null]
                );
                clientId = clientResult.rows[0].id;
              }
            } else {
              // No email - create new client
              clientResult = await client.query(
                `INSERT INTO client (name, type, contact_name, phone, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id`,
                [clientName, clientType, contactInfo.name || null, contactInfo.phone || null]
              );
              clientId = clientResult.rows[0].id;
            }

            clientMap.set(clientKey, clientId);
          }

          // Get or create venue
          let venueId: number;
          const city = row.city?.trim() || '';
          const venueName = row.venue?.trim() || '';
          const venueKey = `${city}|${venueName}`;
          const venueFullName = venueName ? `${city}, ${venueName}` : city || 'Не указано';

          if (venueMap.has(venueKey)) {
            venueId = venueMap.get(venueKey)!;
          } else {
            // Try to get existing venue first
            const existingVenue = await client.query(
              'SELECT id FROM venue WHERE name = $1',
              [venueFullName]
            );

            if (existingVenue.rows.length > 0) {
              venueId = existingVenue.rows[0].id;
            } else {
              // Create new venue
              const venueResult = await client.query(
                `INSERT INTO venue (name, address, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 RETURNING id`,
                [venueFullName, row.venue_address?.trim() || null]
              );
              venueId = venueResult.rows[0].id;
            }

            venueMap.set(venueKey, venueId);
          }

          // Create event
          const status = mapStatus(row.status);
          const budgetPlanned = parseNumber(row.contract_price);
          const budgetActual = parseNumber(row.actual_expenses);
          const title = row.folder_name?.trim() || row.event_id;

          await client.query(
            `INSERT INTO event (title, description, start_date, end_date, status, budget_planned, budget_actual, client_id, venue_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
              title,
              row.comment?.trim() || null,
              startDate.toISOString(),
              endDate.toISOString(),
              status,
              budgetPlanned,
              budgetActual,
              clientId,
              venueId,
            ]
          );

          imported++;
          if (imported % 100 === 0) {
            console.log(`Импортировано ${imported} мероприятий...`);
          }
        } catch (error) {
          errors++;
          console.error(`Ошибка при импорте мероприятия ${row.event_id}:`, error);
        }
      }

      await client.query('COMMIT');
      console.log(`\nИмпорт завершен:`);
      console.log(`  - Импортировано: ${imported}`);
      console.log(`  - Пропущено: ${skipped}`);
      console.log(`  - Ошибок: ${errors}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка импорта:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run import
importEvents();
