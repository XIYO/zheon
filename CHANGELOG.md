## [1.0.3](https://github.com/XIYO/zheon/compare/v1.0.2...v1.0.3) (2025-11-14)


### Bug Fixes

* Docker 태그 생성 오류 수정 ([a0950dd](https://github.com/XIYO/zheon/commit/a0950ddb10daae1ca42f6235b9f07618c88c3bdd))

## [1.0.2](https://github.com/XIYO/zheon/compare/v1.0.1...v1.0.2) (2025-11-14)


### Bug Fixes

* PAT 사용으로 release 이벤트 시 deploy 워크플로우 자동 트리거 ([53d423f](https://github.com/XIYO/zheon/commit/53d423fdd54d5b90a48ac183b13617968bc0305a))

## [1.0.1](https://github.com/XIYO/zheon/compare/v1.0.0...v1.0.1) (2025-11-14)


### Bug Fixes

* workflow_dispatch 트리거 추가로 수동 배포 가능하게 변경 ([b3362a8](https://github.com/XIYO/zheon/commit/b3362a8e2d6fdcf8fda6bfda092db62b4b8503ae))

# 1.0.0 (2025-11-14)


* 🔥 대규모 코드 정리: 미사용 파일 33개 삭제 및 아키텍처 단순화 ([7fdbde4](https://github.com/XIYO/zheon/commit/7fdbde42aa06d97c13b84a301e871d6ce243867d))


### Bug Fixes

* add placeholders for loading states in summary components ([b8eee6e](https://github.com/XIYO/zheon/commit/b8eee6eae95a68afee626a8c44b1d23c23517012))
* apply theme to error page and regenerate database types ([a4efd30](https://github.com/XIYO/zheon/commit/a4efd30c671c9fb67a2366876ae148f50a50190d))
* CommentService 스키마 참조 수정 ([74d3e45](https://github.com/XIYO/zheon/commit/74d3e45719c4c9c8bd963833c083e689ff41acc5))
* correct Bun image tag to 1-slim ([60ca67d](https://github.com/XIYO/zheon/commit/60ca67d200d9b65c636281122479f4f211832bf3))
* force pull latest Docker image before deployment ([b21272d](https://github.com/XIYO/zheon/commit/b21272d892a9670d086ebb9502ac1461e2132304))
* GEMINI_API_KEY 환경변수 접근 및 YouTube 캐시 최적화 ([795b385](https://github.com/XIYO/zheon/commit/795b38546f8b06e8a93c13275ec4e90e4bee7f7c))
* improve realtime updates and title loading with optimistic UI ([32a86b4](https://github.com/XIYO/zheon/commit/32a86b4239a5797404960f1328ecb8137fe781c9))
* Node.js 22 요구사항 충족 및 npx 사용으로 변경 ([ba171df](https://github.com/XIYO/zheon/commit/ba171df707cb02481cc5194f7db8415180ec13d8))
* optimize Docker image - install only socks-proxy-agent ([8f9c640](https://github.com/XIYO/zheon/commit/8f9c6409e670c605fbb6f855acb7fc059c8689a4))
* regenerate database types from remote schema after DB reset ([037f22e](https://github.com/XIYO/zheon/commit/037f22ecfc13fd319da90127388f5f7b6a2beb47))
* remove select('*') to avoid referencing deleted 'url' column ([3773441](https://github.com/XIYO/zheon/commit/37734418b1fefead607d04a2b4a167e5601229d6))
* remove View Transitions to prevent duplicate network requests ([3ba31b6](https://github.com/XIYO/zheon/commit/3ba31b63fcf6bbbc2ae09e4f8ea418f22ca0d657))
* replace select('*') with explicit field list to avoid non-existent url column ([b8fb401](https://github.com/XIYO/zheon/commit/b8fb40113e02c35e587e388be7c8cc84b0ee6140))
* resolve all lint errors and improve type safety ([b6e92f4](https://github.com/XIYO/zheon/commit/b6e92f477f0ce8c2d5682419913b7d104648e180))
* resolve deprecated createServerClient type warning ([4ec1f38](https://github.com/XIYO/zheon/commit/4ec1f38c85d8c215eaa047b04c69581ade6ce796))
* revert ops to remove problematic header configuration ([06f6dda](https://github.com/XIYO/zheon/commit/06f6ddaee28dd85456db45e8afe006164a9d29e8))
* revert to select('*') after schema stabilization ([5100bf5](https://github.com/XIYO/zheon/commit/5100bf5832567205e6dcffb83cf5e9133fe084da))
* Supabase zheon 스키마 타입 정의 수정 ([67f9f15](https://github.com/XIYO/zheon/commit/67f9f15dca5c78cba53edab304ecc1c23d94a647))
* SvelteKit route resolve 경로 수정 및 불필요한 파일 제거 ([b78d0ee](https://github.com/XIYO/zheon/commit/b78d0ee6126f51aa8cc8426c67a83041316c2197))
* TypeScript ESLint 설정 정리 및 린트 에러 수정 ([273191a](https://github.com/XIYO/zheon/commit/273191aa1542a5af6202189c2a941930071bd90e))
* TypeScript 타입 에러 수정 ([f8f7637](https://github.com/XIYO/zheon/commit/f8f7637a9ed1c45c1f67958351ca81d799a4c7fd))
* update ops submodule with proxy header configuration ([7459bb3](https://github.com/XIYO/zheon/commit/7459bb32f736311c0909d30471764164bef011c1))
* update ops submodule with proxy header forwarding ([6aa4f11](https://github.com/XIYO/zheon/commit/6aa4f112adb9166d78cf4b2b3a27fd2017f93536))
* update Supabase configuration to production and fix column references ([66a4b1e](https://github.com/XIYO/zheon/commit/66a4b1e57e99c98f9349f29c81424a7d7615efb6))
* use bash to execute start.sh to avoid permission error ([2795cd1](https://github.com/XIYO/zheon/commit/2795cd1e10e11857d222aea74a505a34a472d022))
* use Bun Debian images to avoid Alpine AVX crash ([57115f1](https://github.com/XIYO/zheon/commit/57115f1b7166cb6498a934aebaf277f824c293c8))
* YouTube API 프록시 설정 적용 ([984b66c](https://github.com/XIYO/zheon/commit/984b66c74bc78237ef1e61b94c7f27d9e576143f))
* 타입 에러 10개 추가 감소 (132 → 127) ([fceddb4](https://github.com/XIYO/zheon/commit/fceddb43796195a855c2511fadff57b37a52d0e9))
* 타입 에러 2개 추가 감소 (139 → 137) ([74acc87](https://github.com/XIYO/zheon/commit/74acc872d6053fbb9c889515f9655eb7ea77e804))
* 타입 에러 63개 감소 (202 → 139) ([c681fd1](https://github.com/XIYO/zheon/commit/c681fd1c16e0566270ae0bf3677f10ae4d70946a))


### Code Refactoring

* consolidate all migrations into single schema.sql ([109b4cb](https://github.com/XIYO/zheon/commit/109b4cb0857823665c8fca1d869e9790e193868a))
* migrate from UUID-based to video_id-based routing ([e3fa3a6](https://github.com/XIYO/zheon/commit/e3fa3a60046660a7730a6518d124381aa4e3ef8f))


### Features

* add community metrics visualization with emotion and age distribution ([6e17bf1](https://github.com/XIYO/zheon/commit/6e17bf1933c1824d466eaad6b5971c4b660adfa9))
* add content analysis system with categories, tags, and metrics ([697fcc6](https://github.com/XIYO/zheon/commit/697fcc6fbf9887ecee8ad873b29c9c8960ca934e))
* add created_at column to summaries table ([0f39b0f](https://github.com/XIYO/zheon/commit/0f39b0fa0b7573cb1fef6e3973e73226e7e2840f))
* add created_at to all tables and use it for cursor-based queries ([d5db75f](https://github.com/XIYO/zheon/commit/d5db75f8bc8f4eee4b179b657637f1c617ef71ee))
* Add deploy script and update wrangler version in configuration files ([e76aea3](https://github.com/XIYO/zheon/commit/e76aea373e1d3915f61cfd7fee0dea1309809bdf))
* Add Slidev presentation and improve community components ([2a7bca3](https://github.com/XIYO/zheon/commit/2a7bca3a0a92b673820d45670e51f40e6a32cb9e))
* Add Slidev presentation with deployment strategy ([89eb842](https://github.com/XIYO/zheon/commit/89eb8426e056293f6f06a8a166f7c33f8ab19cfb))
* add Supabase CLI skill ([449c2de](https://github.com/XIYO/zheon/commit/449c2de4315822506db956de66b2fdb8be954e63))
* Add YouTube subtitle extraction and AI summarization features ([b0e7caf](https://github.com/XIYO/zheon/commit/b0e7caf372cdd6aaba79bc377dece923e8ddf717))
* CommentService 구현 및 통합 테스트 추가 ([d172094](https://github.com/XIYO/zheon/commit/d1720943061503aa96860b09a5d92b3d86c258ca))
* createSummary에 디버깅 로그 추가 ([e4b347d](https://github.com/XIYO/zheon/commit/e4b347dcddb442a6f35ee7292aca0f20d8f6f90b))
* Enhance sign-up and sign-in forms with improved styling and validation ([2799f96](https://github.com/XIYO/zheon/commit/2799f961a94c4c74227c8672adf53c44a81d0b17))
* migrate to Bun runtime in Docker ([569f44a](https://github.com/XIYO/zheon/commit/569f44aca1e56e77ab323cdd507c936eca9996c9))
* optimize Docker build and add local testing setup ([4c03468](https://github.com/XIYO/zheon/commit/4c03468d85619dbc9e990953a88e445a62e9df79))
* Remote Functions 구현 및 라우팅 구조 개선 ([7a177ac](https://github.com/XIYO/zheon/commit/7a177acce55168ace34ced83619c96e4ded56164))
* YouTube remote functions 및 server utilities 추가 ([2740f35](https://github.com/XIYO/zheon/commit/2740f359921dca2efa107be47482844bffc987de))
* YouTube URL 기반 UUID 생성 함수 추가 ([afae448](https://github.com/XIYO/zheon/commit/afae448e7db1b841fadc2159339f53c2c02bed6f))
* YouTube 영상 정보 자동 가져오기 및 실시간 업데이트 구현 ([1ded3df](https://github.com/XIYO/zheon/commit/1ded3df5344bc0652e3f95259717dbb544b99fc4))


### Performance Improvements

* add timing logs to hooks.server.ts ([1e57611](https://github.com/XIYO/zheon/commit/1e57611c6a0ec1993643c8c09c366c91af28ac27))
* optimize multi-platform build - build once, copy to multiple runtimes ([05e1cd6](https://github.com/XIYO/zheon/commit/05e1cd62140d0bb9428ed449ce6a3b2c64bcfbe4))


### Reverts

* use adapter-auto instead of adapter-node ([808d6e1](https://github.com/XIYO/zheon/commit/808d6e17df4d7bb987e6fadcbc43f0878b75f601))


### BREAKING CHANGES

* All previous migrations replaced with consolidated schema

- Consolidate 9 migration files into 00000000000000_schema.sql
- Include all schema changes: video_id migration, created_at, score ranges
- Add pg_cron extension and cleanup_stuck_processing function
- Update database types to reflect consolidated schema

Changes:
- Remove url column, use video_id as primary identifier
- Add created_at to all tables with NOT NULL constraint
- Fix sentiment/community score ranges to -100~100
- Add idx_summaries_created_at index for cursor-based pagination
- Include all RLS policies, grants, and realtime settings

Migration path:
1. Local: pnpm supabase db reset (completed)
2. Remote: Manual confirmation required for production safety
* URL structure changed from /[uuid] to /[videoId]

- Add video_id column to summaries table with migration
- Set UUID as auto-generated default (gen_random_uuid)
- Remove redundant url column (computed from video_id)
- Update routing: [id] → [videoId] for YouTube video IDs
- Modify queries to use video_id instead of url
- Add loading skeletons using Skeleton UI placeholders
- Update form to extract video_id from YouTube URL
- Remove unused utility functions (normalizeYouTubeUrl, generateYouTubeUuid)
- Update Realtime subscriptions to track video_id changes

Migrations:
- 20251111152552: Add video_id column and populate from urls
- 20251111153130: Set id column default to gen_random_uuid()
- 20251111153500: Drop url column (redundant data)

Benefits:
- Meaningful URLs: /vnF2e7b10y4 instead of /uuid
- Single source of truth: video_id is the primary identifier
- Reduced data duplication
- Improved user experience with recognizable URLs
* - user_id 컬럼 제거 및 public cache 모델로 전환
- UPSERT 기반 중복 방지 아키텍처
- Webhook 기반 비동기 처리 (summary → process-video)

통계: 62개 파일 변경, 138줄 추가(+), 9995줄 삭제(-)
