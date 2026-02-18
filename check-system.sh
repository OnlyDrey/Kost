#!/usr/bin/env bash
# Family Finance - System Requirements Check
# Run this first: bash check-system.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
fail() { echo -e "${RED}  ✗${NC} $1"; }
warn() { echo -e "${YELLOW}  !${NC} $1"; }
info() { echo -e "${BLUE}  →${NC} $1"; }

echo ""
echo "======================================"
echo "  Family Finance - System Check"
echo "======================================"
echo ""

ERRORS=0

# --- Node.js ---
echo "Node.js"
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    ok "Node.js v$NODE_VERSION (Node 20+ required)"
  elif [ "$NODE_MAJOR" -ge 18 ]; then
    warn "Node.js v$NODE_VERSION is EOL since April 2025. Upgrade to Node 22:"
    info "nvm install 22 && nvm use 22"
    ERRORS=$((ERRORS+1))
  else
    fail "Node.js v$NODE_VERSION is too old. Requires Node 20+."
    info "nvm install 22 && nvm use 22"
    ERRORS=$((ERRORS+1))
  fi
else
  fail "Node.js not found"
  info "Install via nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  info "Then: nvm install 22 && nvm use 22"
  ERRORS=$((ERRORS+1))
fi

echo ""

# --- npm ---
echo "npm"
if command -v npm &>/dev/null; then
  NPM_VERSION=$(npm --version)
  NPM_MAJOR=$(echo "$NPM_VERSION" | cut -d. -f1)
  if [ "$NPM_MAJOR" -ge 9 ]; then
    ok "npm v$NPM_VERSION (npm 9+ required)"
  else
    fail "npm v$NPM_VERSION is too old. Requires npm 9+."
    info "npm install -g npm@latest"
    ERRORS=$((ERRORS+1))
  fi
else
  fail "npm not found"
  ERRORS=$((ERRORS+1))
fi

echo ""

# --- Docker ---
echo "Docker"
if command -v docker &>/dev/null; then
  DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
  ok "Docker v$DOCKER_VERSION"
else
  fail "Docker not found"
  info "Install Docker: https://docs.docker.com/engine/install/"
  ERRORS=$((ERRORS+1))
fi

echo ""

# --- Docker Compose V2 ---
echo "Docker Compose"
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version | grep -oP 'v?\d+\.\d+\.\d+' | head -1)
  ok "Docker Compose V2 $COMPOSE_VERSION (plugin)"
else
  fail "Docker Compose V2 not available"
  warn "You may have the OLD Python-based docker-compose V1 installed."
  warn "That version crashes on Python 3.12+ with 'No module named distutils'"
  echo ""
  info "Fix on Ubuntu/Debian:"
  info "  sudo apt-get update"
  info "  sudo apt-get install docker-compose-plugin"
  echo ""
  info "Or install Docker Desktop which includes Compose V2:"
  info "  https://docs.docker.com/desktop/install/linux/"
  ERRORS=$((ERRORS+1))
fi

# Check if old docker-compose V1 is installed (causes confusion)
if command -v docker-compose &>/dev/null 2>&1; then
  OLD_VERSION=$(docker-compose --version 2>/dev/null | head -1 || echo "unknown")
  warn "Old docker-compose V1 is also installed ($OLD_VERSION)"
  warn "This project uses 'docker compose' (V2, no hyphen)"
  warn "Consider removing it: sudo apt-get remove docker-compose"
fi

echo ""

# --- Summary ---
echo "======================================"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}  ✓ All requirements met! Run: npm install${NC}"
else
  echo -e "${RED}  ✗ $ERRORS issue(s) found. Fix them above before running npm install.${NC}"
fi
echo "======================================"
echo ""

exit "$ERRORS"
