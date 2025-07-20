#!/bin/bash

set -e

ROOT_DIR="$(pwd)"

SERVICES=("Backend_v2" "code-review-platform" "LLM-Health-Service" "PR-Chatbot" "PR-Reviewer" "Webhook")

for SERVICE in "${SERVICES[@]}"; do
  COMPOSE_FILE="$ROOT_DIR/$SERVICE/docker-compose.yml"
  
  if [ -f "$COMPOSE_FILE" ]; then
    echo "🚀 Starting docker-compose in: $SERVICE"
    (cd "$ROOT_DIR/$SERVICE" && docker-compose up -d)
  else
    echo "⚠️  No docker-compose.yml found in: $SERVICE"
  fi

  echo ""
done

echo "✅ Tất cả docker-compose đã được chạy."
