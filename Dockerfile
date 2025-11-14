# Runtime only - GitHub Actions에서 빌드된 결과물 사용
FROM oven/bun:1-slim

WORKDIR /app

COPY build ./build

# socks-proxy-agent만 설치 (external로 지정되어 번들 제외됨)
RUN bun add socks-proxy-agent

USER bun

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "build/index.js"]
