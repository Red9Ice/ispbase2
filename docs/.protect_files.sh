#!/bin/bash
# Скрипт защиты важных файлов документации
# Эти файлы критически важны для проекта и не должны удаляться

PROTECTED_FILES=(
    "project.md"
    "tasktracker.md"
    "diary.md"
    "qa.md"
)

check_protected() {
    for file in "${PROTECTED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            echo "⚠️  ВНИМАНИЕ: Защищенный файл $file отсутствует!"
            echo "Эти файлы критически важны для проекта и не должны удаляться."
            return 1
        fi
    done
    return 0
}

# Проверка при запуске скрипта
check_protected
