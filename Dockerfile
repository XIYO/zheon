# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=builder --chown=bun:bun /app/build ./build
COPY --from=builder --chown=bun:bun /app/package.json ./

USER bun

EXPOSE 3000

CMD ["bun", "run", "build/index.js"]
