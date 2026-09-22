#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Load .env if present
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    if [ -n "$DATABASE_CONNECTION_STRING" ]; then
        export ConnectionStrings__DefaultConnection="$DATABASE_CONNECTION_STRING"
    fi
    if [ -n "$TEACHER_EMAIL" ]; then
        export Teacher__Email="$TEACHER_EMAIL"
    fi
    if [ -n "$TEACHER_PASSWORD" ]; then
        export Teacher__Password="$TEACHER_PASSWORD"
    fi
    if [ -n "$TEACHER_FULL_NAME" ]; then
        export Teacher__FullName="$TEACHER_FULL_NAME"
    fi
fi

echo "================================================="
echo "   LMS 2.0: Database Purge & Teacher Reset       "
echo "================================================="

dotnet run --project "$PROJECT_ROOT/backend/Lms.Api" -- --wipe-database
