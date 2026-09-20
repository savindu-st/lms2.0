#!/usr/bin/env bash
set -e

# Directory where the script resides
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env if present
if [ -f "$SCRIPT_DIR/../.env" ]; then
    echo "Loading environment variables from .env..."
    export $(grep -v '^#' "$SCRIPT_DIR/../.env" | xargs)
    if [ -n "$DATABASE_CONNECTION_STRING" ]; then
        export ConnectionStrings__DefaultConnection="$DATABASE_CONNECTION_STRING"
    fi
    if [ -n "$JWT_SECRET_KEY" ]; then
        export Jwt__SecretKey="$JWT_SECRET_KEY"
    fi
    if [ -n "$JWT_ISSUER" ]; then
        export Jwt__Issuer="$JWT_ISSUER"
    fi
    if [ -n "$JWT_AUDIENCE" ]; then
        export Jwt__Audience="$JWT_AUDIENCE"
    fi
fi

echo "================================================="
echo "   Starting Accounting LMS Services via YARP    "
echo "================================================="

# Trap Ctrl+C (SIGINT) and kill all background jobs
cleanup() {
    echo ""
    echo "Stopping all LMS services..."
    kill $(jobs -p) 2>/dev/null || true
    echo "All services stopped."
}
trap cleanup SIGINT SIGTERM EXIT

echo "1. Starting Lms.Api (Internal Port: 5001)..."
dotnet run --project "$SCRIPT_DIR/Lms.Api" --urls "http://localhost:5001" &
API_PID=$!

# Brief pause for API startup
sleep 2

echo "2. Starting Lms.Gateway (Public Gateway: 5000)..."
dotnet run --project "$SCRIPT_DIR/Lms.Gateway" --urls "http://localhost:5000" &
GATEWAY_PID=$!

echo ""
echo "Services are up and running!"
echo " - Gateway (Public entry for Angular): http://localhost:5000"
echo " - Swagger via Gateway: http://localhost:5000/swagger"
echo " - Backend API (Internal): http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for all background processes
wait
