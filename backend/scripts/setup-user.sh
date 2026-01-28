#!/bin/bash
# Создание пользователя PostgreSQL для текущего пользователя системы

CURRENT_USER=$(whoami)

echo "=== Создание пользователя PostgreSQL для $CURRENT_USER ==="
echo ""
echo "Этот скрипт создаст пользователя PostgreSQL с именем $CURRENT_USER"
echo "и даст ему права на базу данных imlight."
echo ""
echo "Потребуется один раз ввести пароль sudo."
echo ""

# Создание пользователя
sudo -u postgres psql <<EOF
-- Создание пользователя (если не существует)
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$CURRENT_USER') THEN
        CREATE USER $CURRENT_USER;
        ALTER USER $CURRENT_USER CREATEDB;
    END IF;
END
\$\$;

-- Предоставление прав на базу данных imlight
GRANT ALL PRIVILEGES ON DATABASE imlight TO $CURRENT_USER;

-- Подключение к базе данных и предоставление прав на схему
\c imlight
GRANT ALL ON SCHEMA public TO $CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $CURRENT_USER;

\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Пользователь $CURRENT_USER создан и получил права на базу данных imlight"
    echo ""
    echo "Теперь можно запустить импорт без пароля:"
    echo "  cd backend"
    echo "  export DATABASE_URL=\"postgresql://$CURRENT_USER@/imlight?host=/var/run/postgresql\""
    echo "  npm run import:events"
else
    echo ""
    echo "❌ Ошибка при создании пользователя"
    exit 1
fi
