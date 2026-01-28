#!/bin/bash
# Простой скрипт для создания БД и импорта

set -e

echo "=== Настройка базы данных и импорт ==="
echo ""

# Шаг 1: Создание базы данных
echo "📦 Шаг 1: Создание базы данных..."
echo "Выполните команду (потребуется пароль sudo):"
echo "  sudo -u postgres psql -f backend/scripts/create-db.sql"
echo ""
read -p "База данных создана? (y/n): " db_created

if [ "$db_created" != "y" ]; then
    echo "Создайте базу данных и запустите скрипт снова."
    exit 1
fi

# Шаг 2: Определение пароля
echo ""
echo "📝 Шаг 2: Настройка подключения"
echo "Введите пароль для пользователя postgres (или нажмите Enter, если пароля нет):"
read -sp "Пароль: " PGPASSWORD
echo ""

if [ -n "$PGPASSWORD" ]; then
    export PGPASSWORD
    export DATABASE_URL="postgres://postgres:${PGPASSWORD}@localhost:5432/imlight"
else
    export DATABASE_URL="postgres://postgres@localhost:5432/imlight"
fi

# Шаг 3: Импорт
echo ""
echo "📥 Шаг 3: Запуск импорта..."
cd backend
npm run import:events

echo ""
echo "✅ Готово!"
