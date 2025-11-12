# TODO

코드가 진실입니다. 아래 항목은 향후 우선순위/논의 후 진행합니다.

## 1) 국제화(i18n) 도입 (보류)

- 목표: 한국어/영어 최소 지원, UI 언어 전환
- 제안 스택: Paraglide.js
- 작업 항목:
  - messages/ko.json, messages/en.json 작성 규칙 수립
  - 빌드/런타임 통합 (paraglide 설정, 메시지 로더)
  - 언어 감지 전략(브라우저 우선/쿠키/URL 파라미터) 설계
  - 전역 i18n Context 제공 및 컴포넌트 교체 전략 수립
  - 번역 키 네이밍 규칙/리뷰 절차 수립
  - 최소 UI(헤더/폼/리스트/상세) 적용 및 회귀 테스트

참고: 현 상태의 코드와 문서는 i18n을 사용하지 않습니다. 실제 도입 시 CLAUDE.md/README를 다시 업데이트합니다.

## 2) TTS: 요약 TTS 및 자막 연동 (보류)

- 요약문 TTS 생성
  - 우선순위(의사결정):
    1) AI SDK에서 바로 호환되는 음성 모델(통합 쉬움)
    2) Gemini 기반 음성(TTS) 모델
    3) Google Cloud Text-to-Speech
    4) OpenAI TTS
  - 포맷: `audio/mpeg` (mp3) 기본, 추후 `audio/ogg` 고려
  - 음성 선택/샘플 속도/톤 옵션, 캐싱 키: `video_id + provider + model + voice + lang`
  - Supabase Storage 업로드 경로/정책 설계 (예: `tts/{video_id}/summary.mp3`)

- 세그먼트 기반 TTS (선택)
  - transcript segments → segment TTS → 연결/버퍼링 전략 수립
  - 최소 분량/최대 분량 가드, 전체 요약 TTS로 폴백

- 플레이어/동기화
  - 오디오 플레이어 UI (재생/일시정지/진행도/재생속도)
  - YouTube iframe API 연동: 영상 시간과 TTS 동기화
  - 원본 음성 ↔ 한국어 음성 토글, 크로스페이드/볼륨 믹싱 옵션

- 자막 오버레이 (선택)
  - 번역 자막 생성/정렬(SRT-like), iframe 상단 오버레이 렌더링
  - 스타일 옵션: 폰트/크기/위치/이중 자막

- 백그라운드 처리/실패 복구
  - Remote Function 백그라운드 패턴 적용(`.catch()`), 진행 상태 Realtime 신호
  - 속도/비용 가드(쿼터 초과, 재시도, 청크 처리)

- 파이프라인 통합
  - `SummaryService.analyzeSummary` 이후 후처리 단계로 TTS 트리거
  - `force`/`skipTTS` 플래그 설계, 실패 시 분석 결과는 유지

- 테스트
  - E2E: 생성→재생→토글→동기화 흐름
  - 단위: 캐시 키/스토리지 경로/에러 핸들링

준비 환경변수(계획):
  - `GEMINI_API_KEY` (이미 사용 중)
  - `GOOGLE_TTS_PROJECT_ID`, `GOOGLE_TTS_CREDENTIALS` (필요 시)
  - `OPENAI_API_KEY` (옵션)
  - AI SDK 통합에 필요한 provider별 키/엔드포인트(추가 정의)

참고: 상세 설계는 `docs/todos/youtube-subtitle-translation-tts-overlay.md` 문서를 기반으로 축약/현행화합니다.

## 3) 문서 전반 정비

- README: Bun 기준 명령어/환경변수 최신화 유지, 기능 섹션 실제 구현과 정합성 점검
- DOCKER.md: docker-compose.yml와 환경변수 키 동기화, tor-proxy 설명 유지
- .env.example: 실제 코드에서 사용하는 키(PUBLIC_SUPABASE_PUBLISHABLE_KEY 등)만 노출
