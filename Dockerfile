# syntax=docker/dockerfile:1

# ---- Stage 1: build/prepare ----
# The demo app has no dependencies, but we keep a build stage so this template
# mirrors a real production multi-stage build (install deps, compile, prune).
FROM node:20-alpine AS build
WORKDIR /app
COPY demo-app/package.json ./
# If the app had dependencies we would run: RUN npm ci --omit=dev
COPY demo-app/ ./

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as a non-root user for good production hygiene.
RUN addgroup -S app && adduser -S app -G app

# Metadata baked into the image at build time. These are overridable at build
# via --build-arg and surfaced to the running app as environment variables.
ARG GIT_SHA=development
ARG BUILD_TIME=unknown
ARG APP_NAME="Graduation Demo"
ENV GIT_SHA=$GIT_SHA \
    BUILD_TIME=$BUILD_TIME \
    APP_NAME=$APP_NAME \
    PORT=8080

COPY --from=build --chown=app:app /app ./
USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "server.js"]
