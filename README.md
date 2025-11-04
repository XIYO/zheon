# Zheon

크롬 실행

```shell
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.codex-chrome-profile"
```

YouTube 영상 자막을 추출해 다국어 요약/인사이트를 제공하는 SvelteKit + Supabase 애플리케이션입니다. Cloudflare Workers에 배포되며, Edge Functions로 AI 요약 파이프라인을 구성합니다.

## 빠른 시작

```bash
pnpm install
pnpm dev   # http://localhost:5170
```

## 주요 기술 스택

- SvelteKit 2 (Svelte 5), Tailwind CSS 4, Skeleton UI
- Supabase (PostgreSQL, Edge Functions), Cloudflare Workers
- Vitest, Playwright, Deno Test
- JavaScript + JSDoc (TypeScript 미사용)

## 문서

- 개발 안내: `DEVELOPMENT.md`
- 아키텍처: `ARCHITECTURE.md`
- Supabase CLI 가이드: `docs/supabase-cli.md`
- 작업 기록: `docs/worklogs.md`

## 스크립트

```bash
pnpm build       # 프로덕션 빌드
pnpm preview     # 빌드 미리보기 (http://localhost:4173)
pnpm check       # Svelte + JS 체크
pnpm format      # Prettier 포맷팅
pnpm lint        # ESLint + Prettier 체크
pnpm test        # 전체 테스트 (유닛 + E2E)
```

배포는 `pnpm deploy` 로 Cloudflare Workers에 진행합니다. Edge Functions 관련 세부 워크플로우는 `docs/supabase-cli.md`를 참고하세요.
