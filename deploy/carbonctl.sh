#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
usage() { echo "Usage: $0 {up|down|logs|health|cli} [args...]"; }
case "${1:-}" in
  up) docker compose up -d --build; echo "Carbon API: http://localhost:${CARBON_PORT:-8000}" ;;
  down) docker compose down ;;
  logs) docker compose logs -f carbon ;;
  health) curl -fsS "http://localhost:${CARBON_PORT:-8000}/health" ;;
  cli) shift; docker compose run --rm carbon python -m server.cli "$@" ;;
  *) usage; exit 2 ;;
esac
