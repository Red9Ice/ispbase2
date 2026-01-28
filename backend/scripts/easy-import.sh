#!/bin/bash
# Простой скрипт импорта без пароля

set -e

CURRENT_USER=$(whoami)

echo "=== Импорт данных в базу imlight ==="
echo ""

# Проверка наличия пользователя в PostgreSQL
if ! psql -d imlight -U "$CURRENT_USER" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "⚠️  Пользователь $CURRENT_USER не имеет доступа к базе данных."
    echo ""
    echo "Создайте пользователя командой (потребуется один раз ввести пароль sudo):"
    echo "  bash backend/scripts/setup-user.sh"
    echo ""
    read -p "Создать пользователя сейчас? (y/n): " create_user
    
    if [ "$create_user" = "y" ]; then
        bash "$(dirname "$0")/setup-user.sh"
    else
        echo "Импорт отменен. Создайте пользователя и запустите скрипт снова."
        exit 1
    fi
fi

echo "✅ Подключение к базе данных установлено"
echo ""

# Запуск импорта
echo "📥 Запуск импорта..."
cd "$(dirname "$0")/.."
export DATABASE_URL="postgresql://$CURRENT_USER@/imlight?host=/var/run/postgresql"
npm run import:events

echo ""
echo "✅ Импорт завершен!"
