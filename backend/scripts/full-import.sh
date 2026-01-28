#!/bin/bash
# Полный скрипт для создания БД и импорта данных

set -e

echo "=== Полная настройка и импорт данных ==="
echo ""

# Запрос пароля PostgreSQL
echo "Введите пароль для пользователя postgres:"
read -sp "Пароль: " POSTGRES_PASSWORD
echo ""
echo ""

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "⚠️  Пароль не введен. Попробую подключиться без пароля..."
    PGPASSWORD=""
else
    export PGPASSWORD="$POSTGRES_PASSWORD"
fi

# Создание базы данных
echo "📦 Создание базы данных imlight..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U postgres -d postgres <<EOF 2>&1 || true
SELECT 'CREATE DATABASE imlight'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'imlight')\gexec
\q
EOF

# Проверка создания
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw imlight; then
    echo "✅ База данных создана или уже существует"
else
    echo "❌ Не удалось создать базу данных. Попробуйте вручную:"
    echo "   sudo -u postgres psql -c 'CREATE DATABASE imlight;'"
    exit 1
fi

# Применение миграций
echo ""
echo "📝 Применение миграций..."
MIGRATION_FILE="../../docs/migrations/001_init.sql"
if [ -f "$MIGRATION_FILE" ]; then
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U postgres -d imlight -f "$MIGRATION_FILE" 2>&1 | grep -q "COMMIT"; then
        echo "✅ Миграции применены"
    else
        echo "⚠️  Миграции могут быть уже применены или произошла ошибка"
    fi
else
    echo "❌ Файл миграций не найден: $MIGRATION_FILE"
    exit 1
fi

# Настройка DATABASE_URL
echo ""
echo "🔗 Настройка подключения..."
if [ -n "$POSTGRES_PASSWORD" ]; then
    export DATABASE_URL="postgres://postgres:${POSTGRES_PASSWORD}@localhost:5432/imlight"
else
    export DATABASE_URL="postgres://postgres@localhost:5432/imlight"
fi

# Запуск импорта
echo ""
echo "📥 Запуск импорта мероприятий..."
cd "$(dirname "$0")/.."
npm run import:events

echo ""
echo "✅ Импорт завершен!"
