#!/bin/bash
# dev.sh - Inicia API + Web simultaneamente
# Uso: ./dev.sh [opções]
# Opções:
#   --docker    Usa docker-compose
#   --tunnel    Inicia ngrok para teste mobile
#   --help      Mostra ajuda

set -e

USE_DOCKER=false
USE_TUNNEL=false

for arg in "$@"; do
  case $arg in
    --docker)
      USE_DOCKER=true
      ;;
    --tunnel)
      USE_TUNNEL=true
      ;;
    --help)
      echo "Uso: ./dev.sh [opções]"
      echo ""
      echo "Opções:"
      echo "  --docker    Usa docker-compose (requer Docker)"
      echo "  --tunnel    Inicia ngrok para teste mobile (porta 5173)"
      echo "  --help      Mostra esta ajuda"
      echo ""
      echo "Exemplos:"
      echo "  ./dev.sh              # Roda local (npm run dev)"
      echo "  ./dev.sh --docker     # Roda com Docker"
      echo "  ./dev.sh --tunnel     # Roda local + ngrok tunnel"
      echo "  ./dev.sh --docker --tunnel  # Docker + ngrok"
      exit 0
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "🛑 Parando serviços..."
  kill $(jobs -p) 2>/dev/null || true
  if [ "$USE_DOCKER" = true ]; then
    docker-compose down
  fi
  exit 0
}
trap cleanup INT TERM

echo "🚀 Iniciando ambiente de desenvolvimento..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$USE_DOCKER" = true ]; then
  echo "🐳 Modo Docker: iniciando containers..."
  docker-compose up --build -d
  echo "✅ API:  http://localhost:4000"
  echo "✅ Web:  http://localhost:5173"
  echo "✅ DB:   localhost:5432"
else
  echo "📦 Modo Local: instalando dependências se necessário..."
  
  # API
  echo "🔧 API..."
  cd "$ROOT_DIR/apps/api"
  if [ ! -d "node_modules" ]; then npm ci; fi
  npm run dev &
  API_PID=$!
  
  # Web
  echo "🌐 Web..."
  cd "$ROOT_DIR/apps/web"
  if [ ! -d "node_modules" ]; then npm ci; fi
  npm run dev &
  WEB_PID=$!
  
  echo "✅ API:  http://localhost:4000 (PID: $API_PID)"
  echo "✅ Web:  http://localhost:5173 (PID: $WEB_PID)"
fi

# Tunnel ngrok se solicitado
if [ "$USE_TUNNEL" = true ]; then
  echo "🌐 Iniciando túnel ngrok..."
  sleep 3
  ./ngrok-tunnel.sh 5173 &
  NGROK_PID=$!
fi

echo ""
echo "📋 Logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
wait