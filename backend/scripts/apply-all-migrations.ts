/**
 * @file: apply-all-migrations.ts
 * @description: Скрипт для применения всех миграций по порядку
 * @dependencies: common/database, fs
 * @created: 2026-01-28
 */

import { pool } from '../src/common/database';
import { readFileSync } from 'fs';
import { join } from 'path';

const migrations = [
  '001_init.sql',
  '002_add_user_table.sql',
  '002_entity_change_history.sql',
  '003_add_manager_to_events.sql',
  '004_history_retention_1year.sql',
  '005_add_event_fields.sql',
];

async function applyMigrations() {
  try {
    console.log('=== Применение миграций базы данных ===\n');

    // Проверяем, какие миграции уже применены
    let appliedMigrations: string[] = [];
    try {
      const result = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event'"
      );
      if (result.rows.length > 0) {
        console.log('✅ Таблица event существует, проверяем какие миграции уже применены...\n');
        // Если таблица event существует, значит 001_init.sql применена
        appliedMigrations.push('001_init.sql');
        
        // Проверяем наличие колонки manager_id (миграция 003)
        const managerCheck = await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'manager_id'"
        );
        if (managerCheck.rows.length > 0) {
          appliedMigrations.push('003_add_manager_to_events.sql');
        }
        
        // Проверяем наличие колонки contract_price (миграция 005)
        const contractPriceCheck = await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'contract_price'"
        );
        if (contractPriceCheck.rows.length > 0) {
          console.log('⚠️  Миграция 005_add_event_fields.sql уже применена!');
          await pool.end();
          process.exit(0);
        }
      }
    } catch (error) {
      // Игнорируем ошибки проверки
    }

    // Применяем миграции по порядку
    for (const migration of migrations) {
      if (appliedMigrations.includes(migration)) {
        console.log(`⏭️  Пропуск ${migration} (уже применена)`);
        continue;
      }

      const migrationPath = join(__dirname, '../../docs/migrations', migration);
      
      try {
        const migrationSQL = readFileSync(migrationPath, 'utf-8');
        console.log(`📝 Применение ${migration}...`);
        
        await pool.query(migrationSQL);
        
        console.log(`✅ ${migration} применена успешно\n`);
        appliedMigrations.push(migration);
      } catch (error: any) {
        if (error.code === '42P01' && migration !== '001_init.sql') {
          console.log(`⚠️  ${migration} требует предварительных миграций, пропускаем...\n`);
          continue;
        }
        throw error;
      }
    }

    console.log('✅ Все миграции применены успешно!');
    console.log('\nПрименённые миграции:');
    appliedMigrations.forEach(m => console.log(`  - ${m}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при применении миграций:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigrations();
