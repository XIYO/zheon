# Runtime only - GitHub Actions에서 빌드된 결과물 사용
FROM oven/bun:1-slim

WORKDIR /app

COPY build ./build
COPY package.json ./

USER bun

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "build/index.js"]
