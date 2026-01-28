/**
 * @file: clear-database.sql
 * @description: Удаление всех записей из всех таблиц базы данных с сохранением структуры
 * @dependencies: database connection
 * @created: 2026-01-27
 */

BEGIN;

-- Удаление всех записей из всех таблиц
-- Используем TRUNCATE CASCADE для автоматического удаления зависимых записей
-- Порядок не важен при использовании CASCADE

-- Получаем список всех таблиц и удаляем данные из них
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Сброс всех последовательностей (чтобы ID начинались с 1 при следующем добавлении)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
    END LOOP;
END $$;

COMMIT;
