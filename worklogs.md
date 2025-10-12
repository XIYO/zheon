# Work Logs

## 2025-10-09: Edge Function 프롬프트 개선 및 배포

### 작업 내용
- `supabase/functions/_shared/runnables/generate-summary.ts` 프롬프트 대폭 개선
  - summary: 1-2문장 → 500자 체계적 요약
  - insights: 5000자+ 복잡한 구조 → 2000자 3섹션 구조
  - 핵심 개념 설명 + 사전 지식 & 배경 개념 + 추천 학습 자료
  - temperature: 0.4 → 0.3 (정확성 향상)
  - Hallucination 위험 감소 (영상 내용 기반, 실존 자료만 언급)

### 배포 결과
- 모든 Edge Functions 성공적으로 배포 완료
- summary function: 6.362MB
- Dashboard: https://supabase.com/dashboard/project/iefgdhwmgljjacafqomd/functions

## 2025-10-10: Gemini TTS 및 동시성 제어 시스템 구현

### 작업 내용
- Gemini TTS API를 활용한 고품질 한국어 음성 생성 기능 추가
  - 브라우저 기본 TTS에서 Gemini TTS로 전환 (음질 개선)
  - Gemini API 모델: `gemini-2.5-flash-preview-tts`
  - 음성: Kore (한국어 고품질 음성)
  - 오디오 포맷: PCM → WAV 변환 (24kHz, 16-bit, mono)

- Supabase Edge Function `tts-stream` 생성
  - Gemini TTS API 호출 및 오디오 생성
  - Supabase Storage에 WAV 파일 업로드 (tts-audio 버킷)
  - 동시성 제어를 위한 락 메커니즘 구현

- 데이터베이스 마이그레이션
  - `summary` 테이블에 `summary_audio_url`, `content_audio_url` 컬럼 추가
  - `summary_audio_status`, `content_audio_status` 컬럼 추가 (동시성 제어)
  - Status 값: 'processing', 'completed', 'failed'
  - 인덱스 추가로 성능 최적화

- 동시성 제어 시스템
  - 여러 사용자가 동시에 동일 영상 클릭 시 중복 생성 방지
  - 비관적 락 패턴: status 컬럼으로 processing 상태 관리
  - 폴링 메커니즘: 다른 요청이 처리 중일 때 최대 60초 대기 (2초마다 확인)
  - 캐시 활용: 완료된 오디오는 즉시 반환

- 프론트엔드 구현
  - `/summaries/[id]` 페이지에 Gemini TTS 버튼 추가
  - 캐시된 오디오 우선 재생
  - 실시간 상태 관리 ($state, $derived 활용)

### 배포 결과
- 마이그레이션 적용 완료 (20251010031500, 20251010031501, 20251010050000)
- Edge Function 배포 완료
  - tts-stream: 702kB
  - Dashboard: https://supabase.com/dashboard/project/iefgdhwmgljjacafqomd/functions

## 2025-10-10: Edge Function 리팩토링 - LangChain에서 Vercel AI SDK로 마이그레이션

### 작업 내용
- **insight-generator 독립 Edge Function 생성**
  - Vercel AI SDK 5.0의 `generateObject()` 사용
  - Zod 스키마 기반 구조화된 출력 (Valibot 호환성 이슈로 변경)
  - Gemini 2.5 Flash Lite 모델 활용
  - 번들 크기: 884KB (독립 실행 가능)
  - 응답 필드: title, summary, insights + 통계 정보

- **youtube-extractor.ts 복원**
  - YouTubei.js 직접 사용 제거 (WORKER_LIMIT 문제 발생)
  - 외부 Extractor API (https://extractor.xiyo.dev/extract) 호출 방식으로 복원
  - 환경변수: EXTRACT_API_URL 추가
  - 번들 크기 감소: 8.076MB → 6.237MB

- **generate-summary.ts 리팩토링**
  - 인라인 Gemini API 호출 → insight-generator Edge Function 호출
  - LangChain Runnable 구조는 유지 (검증된 파이프라인 아키텍처 보존)
  - summary_method: "vercel-ai-sdk-edge-function"

- **update-to-completed.ts 버그 수정**
  - insights 필드가 DB에 저장되지 않던 문제 해결
  - .update() 호출 시 insights 필드 추가

### 최종 아키텍처
```
summary Function (LangChain Runnables orchestrator, 6.237MB)
  ├─ extractSubtitles → Extractor API (https://extractor.xiyo.dev)
  └─ generateSummary → insight-generator Edge Function (Vercel AI SDK)
```

### 배포 결과
- Edge Functions 배포 완료
  - insight-generator: 884KB
  - summary: 6.237MB (이전 8.076MB에서 감소)
- 전체 파이프라인 테스트 성공 (처리 시간: 35초, insights 2855자 정상 생성)
- Dashboard: https://supabase.com/dashboard/project/iefgdhwmgljjacafqomd/functions

### 목표 달성
1. ✅ LangChain → Vercel AI SDK 5.0 마이그레이션
2. ✅ LangChain Runnable 구조 유지 (검증된 아키텍처 보존)
3. ✅ YouTubei.js 제거 및 WORKER_LIMIT 문제 해결
4. ✅ AI 요약 기능 독립 Edge Function으로 분리
