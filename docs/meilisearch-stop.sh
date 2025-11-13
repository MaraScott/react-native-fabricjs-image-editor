#!/bin/bash

# Stop Meilisearch Server

PID_FILE="$HOME/.meilisearch/meilisearch.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  Meilisearch is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "🛑 Stopping Meilisearch (PID: $PID)..."
    kill "$PID"
    
    # Wait for process to stop
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            echo "✅ Meilisearch stopped successfully"
            rm "$PID_FILE"
            exit 0
        fi
        sleep 1
    done
    
    # Force kill if still running
    echo "⚠️  Force killing Meilisearch..."
    kill -9 "$PID"
    rm "$PID_FILE"
    echo "✅ Meilisearch stopped"
else
    echo "⚠️  Meilisearch process not found (PID: $PID)"
    rm "$PID_FILE"
fi
