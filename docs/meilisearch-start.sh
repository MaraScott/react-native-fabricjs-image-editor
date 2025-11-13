#!/bin/bash

# Start Meilisearch Server

MEILI_BINARY="$HOME/.meilisearch/meilisearch"
MEILI_DATA_DIR="$HOME/.meilisearch/data"
PID_FILE="$HOME/.meilisearch/meilisearch.pid"
LOG_FILE="$HOME/.meilisearch/meilisearch.log"

if [ ! -f "$MEILI_BINARY" ]; then
    echo "❌ Meilisearch not installed. Run: ./meilisearch-install.sh"
    exit 1
fi

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Meilisearch is already running (PID: $PID)"
        echo "   Access at: http://localhost:7700"
        exit 0
    else
        rm "$PID_FILE"
    fi
fi

echo "🚀 Starting Meilisearch..."

export MEILI_ENV=development
export MEILI_MASTER_KEY=tinyartist
export MEILI_NO_ANALYTICS=true
export MEILI_DB_PATH="$MEILI_DATA_DIR"
export MEILI_HTTP_ADDR="0.0.0.0:7700"

nohup "$MEILI_BINARY" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

sleep 2

if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
    echo "✅ Meilisearch started successfully"
    echo "   PID: $(cat "$PID_FILE")"
    echo "   Access at: http://localhost:7700"
    echo "   Logs: $LOG_FILE"
else
    echo "❌ Failed to start Meilisearch"
    echo "   Check logs: $LOG_FILE"
    rm "$PID_FILE"
    exit 1
fi
