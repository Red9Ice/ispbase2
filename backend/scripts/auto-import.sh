#!/bin/bash
# Автоматический скрипт для настройки и импорта

set -e

echo "=== Автоматическая настройка и импорт ==="

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен!"
    echo ""
    echo "Установите PostgreSQL командой:"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    echo ""
    echo "Затем запустите этот скрипт снова."
    exit 1
fi

# Запуск PostgreSQL если не запущен
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "Запуск PostgreSQL..."
    sudo systemctl start postgresql
fi

# Создание базы данных
echo "📦 Создание базы данных..."
sudo -u postgres psql <<EOF 2>/dev/null || true
SELECT 'CREATE DATABASE imlight'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'imlight')\gexec
\q
EOF

# Применение миграций
echo "📝 Применение миграций..."
MIGRATION_FILE="../../docs/migrations/001_init.sql"
if [ -f "$MIGRATION_FILE" ]; then
    sudo -u postgres psql -d imlight -f "$MIGRATION_FILE" > /dev/null 2>&1
    echo "✅ Миграции применены"
else
    echo "❌ Файл миграций не найден: $MIGRATION_FILE"
    exit 1
fi

# Настройка DATABASE_URL
export DATABASE_URL="postgres://postgres@localhost:5432/imlight"
echo "🔗 DATABASE_URL: $DATABASE_URL"

# Запуск импорта
echo ""
echo "📥 Запуск импорта мероприятий..."
cd ../..
npm run import:events

echo ""
echo "✅ Импорт завершен!"
