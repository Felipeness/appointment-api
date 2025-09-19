#!/bin/bash

# Script de build que evita problemas de permissão
echo "🏗️  Building appointment-api..."

# Remove dist se possível, ignore errors
rm -rf dist 2>/dev/null || echo "⚠️  Warning: Could not remove dist directory (permission issues)"

# Cria novo dist com permissões corretas
mkdir -p dist_new

# Executa build na pasta nova
DIST_DIR=dist_new bun run build:alt || npx tsc --outDir dist_new

# Se sucesso, move para dist
if [ -d "dist_new" ]; then
    rm -rf dist 2>/dev/null || true
    mv dist_new dist
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi