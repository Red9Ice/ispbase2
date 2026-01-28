#!/bin/bash
# Быстрая настройка без создания отдельного пользователя (использует postgres)

set -e

echo "=== Быстрая настройка PostgreSQL ==="

# Проверка наличия PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL не установлен. Установите его командой:"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Проверка статуса службы
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "Запуск PostgreSQL..."
    sudo systemctl start postgresql
fi

# Создание базы данных
echo "Создание базы данных imlight..."

sudo -u postgres psql <<EOF
-- Создание базы данных (если не существует)
SELECT 'CREATE DATABASE imlight'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'imlight')\gexec
\q
EOF

echo "База данных создана!"
echo ""
echo "Применение миграций..."

# Применение миграций
MIGRATION_FILE="../../docs/migrations/001_init.sql"
if [ -f "$MIGRATION_FILE" ]; then
    sudo -u postgres psql -d imlight -f "$MIGRATION_FILE"
    echo "Миграции применены!"
else
    echo "Файл миграций не найден: $MIGRATION_FILE"
    exit 1
fi

echo ""
echo "=== База данных настроена! ==="
echo ""
echo "DATABASE_URL для .env файла:"
echo "DATABASE_URL=postgres://postgres@localhost:5432/imlight"
echo ""
echo "Или если у postgres есть пароль:"
echo "DATABASE_URL=postgres://postgres:ВАШ_ПАРОЛЬ@localhost:5432/imlight"
