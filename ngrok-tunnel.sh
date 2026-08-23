#!/bin/bash
# ngrok-tunnel.sh - Exponha localhost para teste mobile
# Uso: ./ngrok-tunnel.sh [porta] (default: 5173)

PORT=${1:-5173}

echo "🌐 Iniciando túnel ngrok para localhost:$PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "📦 ngrok não encontrado. Instalando..."
    if command -v brew &> /dev/null; then
        brew install ngrok/ngrok/ngrok
    elif command -v npm &> /dev/null; then
        npm install -g ngrok
    else
        echo "❌ Instale ngrok manualmente: https://ngrok.com/download"
        exit 1
    fi
fi

# Inicia túnel
ngrok http $PORT --log=stdout