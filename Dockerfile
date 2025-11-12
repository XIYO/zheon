# Build stage
FROM oven/bun:1-debian AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-debian-slim

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

USER bun

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "build/index.js"]
