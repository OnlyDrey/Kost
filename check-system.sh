#!/usr/bin/env bash
# Kost - System Requirements Check
# Run: bash check-system.sh  OR  npm run check

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
fail() { echo -e "${RED}  ✗${NC} $1"; }
warn() { echo -e "${YELLOW}  !${NC} $1"; }
info() { echo -e "${BLUE}  →${NC} $1"; }
bold() { echo -e "${BOLD}$1${NC}"; }

echo ""
bold "======================================"
bold "  Kost - System Check"
bold "======================================"
echo ""

ERRORS=0

# ─── Node.js ──────────────────────────────
bold "Node.js  (required: >=20, recommended: 22 LTS)"
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    ok "Node.js v$NODE_VERSION"
  elif [ "$NODE_MAJOR" -ge 18 ]; then
    fail "Node.js v$NODE_VERSION — EOL since April 2025, upgrade required"
    info "With nvm:  nvm install 22 && nvm use 22"
    info "Without nvm: https://nodejs.org/en/download/"
    ERRORS=$((ERRORS+1))
  else
    fail "Node.js v$NODE_VERSION — too old, requires v20+"
    info "With nvm:  nvm install 22 && nvm use 22"
    ERRORS=$((ERRORS+1))
  fi
else
  fail "Node.js not found"
  info "Install nvm first: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  info "Then: source ~/.bashrc && nvm install 22 && nvm use 22"
  ERRORS=$((ERRORS+1))
fi

echo ""

# ─── npm ──────────────────────────────────
bold "npm  (required: >=9)"
if command -v npm &>/dev/null; then
  NPM_VERSION=$(npm --version)
  NPM_MAJOR=$(echo "$NPM_VERSION" | cut -d. -f1)
  if [ "$NPM_MAJOR" -ge 9 ]; then
    ok "npm v$NPM_VERSION"
  else
    fail "npm v$NPM_VERSION — too old, requires v9+"
    info "Upgrade:  npm install -g npm@latest"
    ERRORS=$((ERRORS+1))
  fi
else
  fail "npm not found (install Node.js to get npm)"
  ERRORS=$((ERRORS+1))
fi

echo ""

# ─── Docker ───────────────────────────────
bold "Docker  (required: >=20.10)"
if command -v docker &>/dev/null; then
  DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
  ok "Docker v$DOCKER_VERSION"

  # Check Docker daemon access
  if ! docker info &>/dev/null 2>&1; then
    DOCKER_ERR=$(docker info 2>&1 || true)
    if echo "$DOCKER_ERR" | grep -q "permission denied"; then
      warn "Docker permission denied — your user is not in the 'docker' group"
      info "Fix (apply without logout):  sudo usermod -aG docker \$USER && newgrp docker"
      info "Or prefix commands with sudo: sudo docker compose up -d"
    else
      warn "Docker daemon is not running"
      info "Start it:   sudo systemctl start docker"
      info "Auto-start: sudo systemctl enable docker"
    fi
    ERRORS=$((ERRORS+1))
  fi
else
  fail "Docker not found"
  info "Install Docker Engine (Ubuntu):"
  info "  curl -fsSL https://get.docker.com | sudo bash"
  info "  sudo usermod -aG docker \$USER && newgrp docker"
  ERRORS=$((ERRORS+1))
fi

echo ""

# ─── Docker Compose V2 ────────────────────
bold "Docker Compose V2  (required: the 'docker compose' plugin, NOT legacy 'docker-compose')"
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || docker compose version | grep -oP 'v?\d+\.\d+\.\d+' | head -1)
  ok "Docker Compose V2 $COMPOSE_VERSION  (via 'docker compose' plugin)"
else
  fail "Docker Compose V2 not available ('docker compose' command not found)"
  echo ""
  warn "The old Python-based 'docker-compose' (with hyphen) is EOL and crashes"
  warn "on Python 3.12+. You need Docker Compose V2 (the 'docker compose' plugin)."
  echo ""
  info "Choose ONE of these installation methods:"
  echo ""
  info "Method 1 — apt (requires Docker's official apt repo):"
  info "  sudo apt-get update"
  info "  sudo apt-get install docker-compose-plugin"
  echo ""
  info "Method 2 — manual binary install (works with any Docker install):"
  info "  DOCKER_CONFIG=\${DOCKER_CONFIG:-\$HOME/.docker}"
  info "  mkdir -p \$DOCKER_CONFIG/cli-plugins"
  info "  curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \\"
  info "    -o \$DOCKER_CONFIG/cli-plugins/docker-compose"
  info "  chmod +x \$DOCKER_CONFIG/cli-plugins/docker-compose"
  info "  docker compose version  # verify"
  echo ""
  info "Method 3 — system-wide binary install:"
  info "  sudo mkdir -p /usr/local/lib/docker/cli-plugins"
  info "  sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \\"
  info "    -o /usr/local/lib/docker/cli-plugins/docker-compose"
  info "  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose"
  info "  docker compose version  # verify"
  ERRORS=$((ERRORS+1))
fi

# Warn if broken V1 is also installed
if command -v docker-compose &>/dev/null 2>&1; then
  echo ""
  warn "Legacy 'docker-compose' V1 is also installed on this system"
  warn "It will not work on Python 3.12+ (ModuleNotFoundError: distutils)"
  warn "This project ONLY uses 'docker compose' (V2, no hyphen) — V1 is ignored"
  info "Optional cleanup: sudo apt-get remove docker-compose  OR  sudo rm /usr/bin/docker-compose"
fi

echo ""

# ─── Summary ──────────────────────────────
bold "======================================"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  ✓ All requirements met!${NC}"
  echo ""
  info "Next steps:"
  info "  npm install    — install dependencies"
  info "  cp .env.example .env  — configure environment"
  info "  npm run docker:up     — start services"
else
  echo -e "${RED}${BOLD}  ✗ $ERRORS requirement(s) not met — fix the issues above first${NC}"
fi
bold "======================================"
echo ""

exit "$ERRORS"
