# Инструкция по настройке базы данных и импорту

## Шаг 1: Установка PostgreSQL

Если PostgreSQL не установлен, выполните:

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Шаг 2: Настройка базы данных

Запустите скрипт настройки:

```bash
cd backend/scripts
bash quick-setup.sh
```

Или вручную:

```bash
# Создание базы данных
sudo -u postgres psql -c "CREATE DATABASE imlight;"

# Применение миграций (по порядку)
sudo -u postgres psql -d imlight -f ../../docs/migrations/001_init.sql
sudo -u postgres psql -d imlight -f ../../docs/migrations/002_add_user_table.sql
sudo -u postgres psql -d imlight -f ../../docs/migrations/002_entity_change_history.sql
sudo -u postgres psql -d imlight -f ../../docs/migrations/003_add_manager_to_events.sql
sudo -u postgres psql -d imlight -f ../../docs/migrations/004_history_retention_1year.sql
```

## Шаг 3: Настройка переменных окружения

Создайте файл `.env` в папке `backend`:

```bash
cd backend
cp .env.example .env
```

Отредактируйте `.env` и укажите правильный `DATABASE_URL`:

```env
DATABASE_URL=postgres://postgres@localhost:5432/imlight
```

Если у пользователя postgres есть пароль:
```env
DATABASE_URL=postgres://postgres:ВАШ_ПАРОЛЬ@localhost:5432/imlight
```

## Шаг 4: Запуск импорта

```bash
cd backend
npm run import:events
```

## Альтернатива: Использование Docker

Если у вас установлен Docker, можно использовать готовый контейнер:

```bash
docker run --name postgres-imlight \
  -e POSTGRES_PASSWORD=imlight_password \
  -e POSTGRES_DB=imlight \
  -p 5432:5432 \
  -d postgres:15

# Применить миграции (по порядку)
docker exec -i postgres-imlight psql -U postgres -d imlight < docs/migrations/001_init.sql
docker exec -i postgres-imlight psql -U postgres -d imlight < docs/migrations/002_add_user_table.sql
docker exec -i postgres-imlight psql -U postgres -d imlight < docs/migrations/002_entity_change_history.sql
docker exec -i postgres-imlight psql -U postgres -d imlight < docs/migrations/003_add_manager_to_events.sql
docker exec -i postgres-imlight psql -U postgres -d imlight < docs/migrations/004_history_retention_1year.sql

# Установить DATABASE_URL
export DATABASE_URL=postgres://postgres:imlight_password@localhost:5432/imlight

# Запустить импорт
cd backend
npm run import:events
```
