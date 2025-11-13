#!/bin/bash

# Meilisearch Installation Script (without Docker)
# Downloads and runs Meilisearch binary directly

set -e

MEILI_VERSION="v1.10.3"
MEILI_DIR="$HOME/.meilisearch"
MEILI_DATA_DIR="$MEILI_DIR/data"
MEILI_BINARY="$MEILI_DIR/meilisearch"

echo "🚀 Installing Meilisearch $MEILI_VERSION"

# Create directories
mkdir -p "$MEILI_DIR"
mkdir -p "$MEILI_DATA_DIR"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64)
        ARCH="amd64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Download Meilisearch
DOWNLOAD_URL="https://github.com/meilisearch/meilisearch/releases/download/$MEILI_VERSION/meilisearch-$OS-$ARCH"

echo "📥 Downloading from: $DOWNLOAD_URL"

if command -v curl &> /dev/null; then
    curl -L "$DOWNLOAD_URL" -o "$MEILI_BINARY"
elif command -v wget &> /dev/null; then
    wget -O "$MEILI_BINARY" "$DOWNLOAD_URL"
else
    echo "❌ Neither curl nor wget found. Please install one of them."
    exit 1
fi

# Make executable
chmod +x "$MEILI_BINARY"

echo "✅ Meilisearch installed at: $MEILI_BINARY"
echo ""
echo "To start Meilisearch:"
echo "  ./meilisearch-start.sh"
echo ""
echo "To stop Meilisearch:"
echo "  ./meilisearch-stop.sh"
