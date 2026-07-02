#!/usr/bin/env bash
#
# deploy-local.sh — pull the newest image built by GitHub Actions and (re)start
# it as a container in your local Docker (Docker Desktop).
#
# Usage:
#   ./deploy-local.sh                       # auto-detects image from git remote
#   ./deploy-local.sh ghcr.io/owner/repo    # explicit image name
#   IMAGE=ghcr.io/owner/repo PORT=3000 ./deploy-local.sh
#
# Requirements:
#   - Docker Desktop running
#   - The GHCR package is public, OR you have run `docker login ghcr.io` once
#     (username = your GitHub username, password = a GitHub Personal Access
#      Token with the read:packages scope).

set -euo pipefail

# ---- Resolve the image name -------------------------------------------------
IMAGE="${1:-${IMAGE:-}}"

if [[ -z "${IMAGE}" ]]; then
  # Try to derive ghcr.io/owner/repo from the git "origin" remote.
  if remote_url="$(git config --get remote.origin.url 2>/dev/null)"; then
    slug="$(printf '%s' "$remote_url" \
      | sed -E 's#^git@github.com:#github.com/#; s#^https?://##; s#\.git$##')"
    # slug now looks like: github.com/OWNER/REPO
    owner_repo="${slug#github.com/}"
    IMAGE="ghcr.io/$(printf '%s' "$owner_repo" | tr '[:upper:]' '[:lower:]')"
  fi
fi

if [[ -z "${IMAGE}" ]]; then
  echo "Could not determine the image name."
  echo "Pass it explicitly, e.g.: ./deploy-local.sh ghcr.io/your-username/your-repo"
  exit 1
fi

TAG="${TAG:-latest}"
FULL_IMAGE="${IMAGE}:${TAG}"
CONTAINER_NAME="${CONTAINER_NAME:-graduation-demo}"
PORT="${PORT:-8080}"

echo "==> Image:     ${FULL_IMAGE}"
echo "==> Container: ${CONTAINER_NAME}"
echo "==> Local URL: http://localhost:${PORT}"
echo

# ---- Make sure Docker is reachable -----------------------------------------
if ! docker info >/dev/null 2>&1; then
  echo "Docker does not appear to be running. Start Docker Desktop and try again."
  exit 1
fi

# ---- Pull the newest image --------------------------------------------------
echo "==> Pulling latest image..."
docker pull "${FULL_IMAGE}"

# ---- Replace any existing container ----------------------------------------
if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "==> Stopping and removing previous container..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

# ---- Run the new container --------------------------------------------------
echo "==> Starting new container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:8080" \
  --restart unless-stopped \
  "${FULL_IMAGE}" >/dev/null

echo
echo "Done. Open http://localhost:${PORT} to see the running version."
echo "It should appear in the Containers tab of Docker Desktop as \"${CONTAINER_NAME}\"."
