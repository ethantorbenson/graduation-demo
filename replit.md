# Graduation Demo — Replit → GitHub → Docker

A tiny demo that graduates code from Replit to a local Docker container: push to GitHub, GitHub Actions builds & publishes a Docker image to GHCR, and a local script pulls & runs it in Docker Desktop.

## Run & Operate

- Demo app (standalone, zero-dependency): `cd demo-app && node server.js` (reads `PORT`, defaults to 8080)
- Graduation flow is documented in `README.md`
- `deploy-local.sh` — pull the latest GHCR image and (re)run it locally in Docker
- `.github/workflows/deploy.yml` — CI that builds & publishes the image on push to `main`
- The rest of the pnpm workspace scaffold (api-server, libs) is unused by the demo but left intact.

## Stack

- Demo app: single zero-dependency Node HTTP server (`demo-app/server.js`), ESM
- Container: multi-stage `Dockerfile` (node:20-alpine, non-root user, healthcheck)
- CI: GitHub Actions → GitHub Container Registry (GHCR)
- The scaffold also ships an unused pnpm workspace (Express/Drizzle/Orval) that the demo does not use.

## Where things live

- `demo-app/` — the web app source (server + package.json)
- `Dockerfile`, `.dockerignore` — build the image; context is the repo root, only `demo-app/` is copied
- `.github/workflows/deploy.yml` — build & publish image to GHCR on push to `main`
- `deploy-local.sh` — local pull-and-run script
- `README.md` — full end-to-end graduation walkthrough

## Architecture decisions

- The demo app is deliberately dependency-free so the Docker image builds fast and needs no `npm ci`.
- Deploy metadata (commit SHA, build time) is injected as Docker build args → env vars, then rendered on the page so each deploy is visibly a new version.
- Image name is derived at CI time as `ghcr.io/<owner>/<repo>` (lowercased); no per-repo config needed.
- Uses the built-in `GITHUB_TOKEN` (no extra secrets) to publish to GHCR.
- `deploy-local.sh` auto-detects the image from the git `origin` remote.

## Product

A one-page app that shows which commit/build it is running, used to demonstrate the Replit → GitHub → GitHub Actions → GHCR → Docker Desktop deployment loop.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
