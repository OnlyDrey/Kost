#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-default}"
IMAGE_TAG="${IMAGE_TAG:-kost-app:latest}"
NODE_IMAGE="${NODE_IMAGE:-node:22-alpine}"

usage() {
  cat <<USAGE
Usage:
  scripts/docker-build.sh [default|mirror|ci]

Modes:
  default  Build with default base image (node:22-alpine)
  mirror   Build with NODE_IMAGE override (for mirror/internal registry)
  ci       Build with BuildKit local cache flags

Environment variables:
  NODE_IMAGE  Base image override (default: node:22-alpine)
  IMAGE_TAG   Output image tag (default: kost-app:latest)

Examples:
  scripts/docker-build.sh default
  NODE_IMAGE=registry.local/library/node:22-alpine scripts/docker-build.sh mirror
  IMAGE_TAG=kost-app:ci scripts/docker-build.sh ci
USAGE
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command '$cmd' not found in PATH." >&2
    echo "Install Docker and try again, or run: npm run docker:image:help" >&2
    exit 127
  fi
}

case "$MODE" in
  default)
    require_cmd docker
    docker build \
      --build-arg NODE_IMAGE=node:22-alpine \
      -t "$IMAGE_TAG" \
      .
    ;;
  mirror)
    require_cmd docker
    docker build \
      --build-arg NODE_IMAGE="$NODE_IMAGE" \
      -t "$IMAGE_TAG" \
      .
    ;;
  ci)
    require_cmd docker
    if ! docker buildx version >/dev/null 2>&1; then
      echo "Error: 'docker buildx' is not available. Install Docker Buildx or use default/mirror mode." >&2
      exit 127
    fi

    docker buildx build \
      --build-arg NODE_IMAGE="$NODE_IMAGE" \
      --cache-from=type=local,src=.buildx-cache \
      --cache-to=type=local,dest=.buildx-cache-new,mode=max \
      --load \
      -t "$IMAGE_TAG" \
      .

    rm -rf .buildx-cache
    mv .buildx-cache-new .buildx-cache
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    usage
    exit 1
    ;;
esac
