/**
 * @file: apply-migration-005.ts
 * @description: Скрипт для применения миграции 005_add_event_fields.sql
 * @dependencies: common/database, fs
 * @created: 2026-01-28
 */

import { pool } from '../src/common/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  try {
    console.log('=== Применение миграции 005_add_event_fields.sql ===\n');

    // Читаем файл миграции
    const migrationPath = join(__dirname, '../../docs/migrations/005_add_event_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Выполнение миграции...');

    // Выполняем SQL из файла миграции
    // Разбиваем на отдельные команды, так как pool.query не поддерживает несколько команд в одной строке
    // Но так как миграция использует BEGIN/COMMIT, выполним весь блок целиком
    await pool.query(migrationSQL);

    console.log('✅ Миграция применена успешно!');
    console.log('\nИзменения:');
    console.log('  - Переименована колонка budget_planned → contract_price');
    console.log('  - Добавлены поля: foreman_id, commercial_proposal, opm, transport, margin, profitability');
    console.log('  - Создан индекс idx_event_foreman_id');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
