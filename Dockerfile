# Build stage - 호스트 플랫폼에서 한 번만 빌드
FROM --platform=$BUILDPLATFORM oven/bun:1-debian AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage - 타겟 플랫폼별 런타임
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

USER bun

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "build/index.js"]
