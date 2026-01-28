#!/bin/bash
# Скрипт для запуска импорта с правильной настройкой подключения к БД

echo "=== Импорт мероприятий из CSV ==="
echo ""

# Проверка наличия файла
if [ ! -f "../../.ispdata" ]; then
    echo "❌ Файл .ispdata не найден!"
    exit 1
fi

echo "📁 Файл найден: ../../.ispdata"
echo ""

# Запрос пароля PostgreSQL, если не указан
if [ -z "$PGPASSWORD" ] && [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" != *"password"* ]]; then
    echo "Для подключения к PostgreSQL нужен пароль."
    echo "Вы можете:"
    echo "  1. Указать пароль через переменную PGPASSWORD:"
    echo "     export PGPASSWORD='ваш_пароль'"
    echo "  2. Или указать полный DATABASE_URL с паролем:"
    echo "     export DATABASE_URL='postgres://postgres:пароль@localhost:5432/imlight'"
    echo ""
    read -sp "Введите пароль для пользователя postgres (или нажмите Enter для пропуска): " PGPASSWORD
    echo ""
    export PGPASSWORD
fi

# Установка DATABASE_URL по умолчанию, если не указан
if [ -z "$DATABASE_URL" ]; then
    if [ -n "$PGPASSWORD" ]; then
        export DATABASE_URL="postgres://postgres:${PGPASSWORD}@localhost:5432/imlight"
    else
        export DATABASE_URL="postgres://postgres@localhost:5432/imlight"
    fi
fi

echo "🔗 Подключение: ${DATABASE_URL//:*@/@}" # Скрываем пароль в выводе
echo ""

# Запуск импорта
cd "$(dirname "$0")/.."
npm run import:events
