#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="apps/web/src/components"
PALETTE_PATTERN='(indigo|red|green|amber|gray|slate|sky|violet|emerald|orange)-[0-9]+'
HEX_PATTERN='#[0-9a-fA-F]{3,8}'

palette_hits=$(rg -n "$PALETTE_PATTERN" "$TARGET_DIR" --glob '*.{ts,tsx,js,jsx,css}' || true)
hex_hits=$(rg -n "$HEX_PATTERN" "$TARGET_DIR" --glob '*.{ts,tsx,js,jsx,css}' || true)

if [[ -n "$palette_hits" ]]; then
  echo "[color-guard] Direct palette class usage found in components:"
  echo "$palette_hits"
fi

if [[ -n "$hex_hits" ]]; then
  echo "[color-guard] Raw hex color usage found in components:"
  echo "$hex_hits"
fi

if [[ -n "${STRICT_COLOR_GUARD:-}" ]] && ([[ -n "$palette_hits" ]] || [[ -n "$hex_hits" ]]); then
  echo "[color-guard] STRICT_COLOR_GUARD enabled; failing."
  exit 1
fi

echo "[color-guard] Completed (advisory mode)."
