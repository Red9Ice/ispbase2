#!/bin/bash
# Скрипт для применения миграции 005_add_event_fields.sql

set -e

echo "=== Применение миграции 005_add_event_fields.sql ==="
echo ""

# Проверка наличия PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен!"
    exit 1
fi

# Путь к файлу миграции
MIGRATION_FILE="../../docs/migrations/005_add_event_fields.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

# Попытка применения миграции
echo "📝 Применение миграции..."

# Вариант 1: Через sudo (если доступен)
if sudo -n true 2>/dev/null; then
    echo "Используется sudo для подключения к PostgreSQL..."
    sudo -u postgres psql -d imlight -f "$MIGRATION_FILE" && echo "✅ Миграция применена успешно!" && exit 0
fi

# Вариант 2: Через DATABASE_URL из .env
if [ -f "../../backend/.env" ]; then
    cd ../../backend
    source .env
    if [ -n "$DATABASE_URL" ]; then
        echo "Используется DATABASE_URL из .env..."
        PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        if [ -n "$PGPASSWORD" ]; then
            export PGPASSWORD
        fi
        psql "$DATABASE_URL" -f ../docs/migrations/005_add_event_fields.sql && echo "✅ Миграция применена успешно!" && exit 0
    fi
fi

# Вариант 3: Интерактивный ввод
echo ""
echo "Попытка подключения к базе данных..."
echo "Введите пароль для пользователя postgres (или нажмите Enter, если пароль не требуется):"
psql -U postgres -d imlight -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Миграция применена успешно!"
else
    echo ""
    echo "❌ Не удалось применить миграцию автоматически."
    echo ""
    echo "Примените миграцию вручную командой:"
    echo "  psql -U postgres -d imlight -f $MIGRATION_FILE"
    echo ""
    echo "Или если используется другой пользователь:"
    echo "  psql -U ВАШ_ПОЛЬЗОВАТЕЛЬ -d imlight -f $MIGRATION_FILE"
    exit 1
fi
