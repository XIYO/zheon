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

COPY --from=builder --chown=bun:bun /app/.svelte-kit/output ./output
COPY --from=builder --chown=bun:bun /app/package.json ./
COPY --from=builder --chown=bun:bun /app/pnpm-lock.yaml ./

RUN bun install --production

USER bun

EXPOSE 3000

CMD ["bun", "run", "output/server/index.js"]
