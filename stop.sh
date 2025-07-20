#!/bin/bash

ROOT_DIR="$(pwd)"
SERVICES=("Backend_v2" "code-review-platform" "LLM-Health-Service" "PR-Chatbot" "PR-Reviewer" "Webhook")

for SERVICE in "${SERVICES[@]}"; do
  COMPOSE_FILE="$ROOT_DIR/$SERVICE/docker-compose.yml"
  if [ -f "$COMPOSE_FILE" ]; then
    echo "🛑 Stopping docker-compose in: $SERVICE"
    (cd "$ROOT_DIR/$SERVICE" && docker-compose down -v)
  fi
done

echo "Done stopping all services."
