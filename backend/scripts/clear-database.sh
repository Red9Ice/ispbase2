#!/bin/bash
# Скрипт для удаления всех записей из базы данных
# Сохраняет структуру таблиц, но удаляет все данные

set -e

echo "=== Удаление всех записей из базы данных ==="
echo ""
echo "⚠️  ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные из базы данных!"
echo "   Структура таблиц будет сохранена."
echo ""

# Запрос подтверждения
read -p "Вы уверены, что хотите продолжить? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Операция отменена."
    exit 0
fi

echo ""
echo "Очистка базы данных..."

# Определяем способ подключения к базе данных
if [ -f "../.env" ]; then
    # Читаем DATABASE_URL из .env файла
    source ../.env
    DB_URL="${DATABASE_URL:-postgres://postgres@localhost:5432/imlight}"
elif [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
else
    DB_URL="postgres://postgres@localhost:5432/imlight"
fi

# Парсим connection string для определения параметров подключения
if [[ "$DB_URL" == *"@"* ]]; then
    # Извлекаем компоненты из URL
    DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p' || echo "$DB_URL" | sed -n 's|.*://\([^@]*\)@.*|\1|p' || echo "postgres")
    DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p' || echo "")
    DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p' || echo "localhost")
    DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p' || echo "5432")
    DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p' || echo "imlight")
else
    # Простой формат без пароля
    DB_USER="postgres"
    DB_PASS=""
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="imlight"
fi

# Если есть пароль, устанавливаем PGPASSWORD
if [ -n "$DB_PASS" ]; then
    export PGPASSWORD="$DB_PASS"
fi

# Выполняем SQL скрипт
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/clear-database.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Файл $SQL_FILE не найден!"
    exit 1
fi

# Используем подключение к базе данных
if ! command -v psql &> /dev/null; then
    echo "❌ psql не найден! Установите PostgreSQL client."
    exit 1
fi

# Пробуем подключиться через Unix socket для localhost без пароля (как в database.ts)
if [ "$DB_HOST" == "localhost" ] && [ -z "$DB_PASS" ] && [ -S "/var/run/postgresql/.s.PGSQL.5432" ] 2>/dev/null; then
    psql -h /var/run/postgresql -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
elif [ -n "$DB_PASS" ]; then
    export PGPASSWORD="$DB_PASS"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
else
    # Пробуем использовать DATABASE_URL напрямую
    psql "$DB_URL" -f "$SQL_FILE" 2>&1 || {
        # Если не получилось, пробуем через TCP/IP
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
    }
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Все записи успешно удалены из базы данных!"
    echo "   Структура таблиц сохранена."
else
    echo ""
    echo "❌ Ошибка при удалении записей!"
    exit 1
fi
