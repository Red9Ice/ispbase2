#!/bin/bash
# Скрипт для установки и настройки PostgreSQL базы данных

set -e

echo "=== Установка и настройка PostgreSQL ==="

# Проверка наличия PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "Установка PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "PostgreSQL уже установлен"
fi

# Проверка статуса службы
if ! sudo systemctl is-active --quiet postgresql; then
    echo "Запуск PostgreSQL..."
    sudo systemctl start postgresql
fi

# Создание базы данных и пользователя
echo "Создание базы данных imlight..."

sudo -u postgres psql <<EOF
-- Создание пользователя (если не существует)
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'imlight_user') THEN
        CREATE USER imlight_user WITH PASSWORD 'imlight_password';
    END IF;
END
\$\$;

-- Создание базы данных (если не существует)
SELECT 'CREATE DATABASE imlight OWNER imlight_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'imlight')\gexec

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE imlight TO imlight_user;
\q
EOF

echo "База данных создана!"
echo ""
echo "Применение миграций..."

# Применение миграций
export PGPASSWORD=imlight_password
psql -h localhost -U imlight_user -d imlight -f ../../docs/migrations/001_init.sql

echo ""
echo "=== База данных настроена! ==="
echo ""
echo "DATABASE_URL для .env файла:"
echo "DATABASE_URL=postgres://imlight_user:imlight_password@localhost:5432/imlight"
