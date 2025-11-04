# Feature Specification: YouTube 영상 품질 분석 시스템

**Version**: 2.0
**Created**: 2025-10-18
**Updated**: 2025-10-28
**Status**: Implemented

---

## 1. Overview

YouTube 영상의 **자막과 댓글**을 AI로 동시 분석하여 영상의 콘텐츠 품질, 커뮤니티 반응, 시청자 특성을 정량적으로 평가하는 통합 분석 시스템이다. 자막 기반 콘텐츠 분석과 댓글 기반 커뮤니티 분석을 결합하여 영상의 종합적인 품질과 신뢰도를 다각도로 평가한다.

**주요 분석 영역:**
- 콘텐츠 품질 (자막 기반): 교육적 가치, 재미, 정확성, 명확성, 깊이
- 여론 분석 (댓글 기반): 긍정/중립/부정 비율, 감정 강도
- 커뮤니티 품질 (댓글 말투 기반): 예의, 독성, 건설성, 주제 관련성
- 나이대 분석 (댓글 말투 기반): 10대/20대/30대/40대+ 분포

---

## 2. Problem Statement

현재 시스템은 영상 메타데이터(조회수, 좋아요, 채널 정보 등)만 저장하고 있으며, 영상의 실제 콘텐츠 품질과 커뮤니티 반응을 정량적으로 분석하지 않는다. 이로 인해:

- 콘텐츠 크리에이터는 영상의 교육적 가치, 재미 요소, 정보 정확성 등 객관적 품질 지표를 알 수 없음
- 영상 시청자는 커뮤니티의 감정 분포와 품질 수준을 파악하기 어려움
- 영상 콘텐츠와 커뮤니티 반응의 종합적인 평가 지표가 부재함

---

## 3. User Scenarios & Testing

### Scenario 1: 콘텐츠 크리에이터가 영상 품질 분석 확인
**Actor**: 콘텐츠 크리에이터
**Flow**:
1. 자신의 영상 페이지에서 "품질 분석" 섹션 열기
2. 분석 완료 상태 확인 (pending/processing/completed/failed)
3. 콘텐츠 품질 점수, 여론 점수, 커뮤니티 품질 점수 확인
4. 세부 지표 확인: 교육적 가치, 재미, 정확성, 감정 분포, 커뮤니티 말투 분석
5. AI 제안사항 및 주요 인사이트 검토

**Acceptance Criteria**:
- 모든 점수 0-100 스케일로 표시
- 감정 분포 및 나이대 분포 시각화
- 주요 인사이트 최대 5개, 개선 제안 최대 3개 제공

### Scenario 2: 시청자가 영상 품질 지표 확인
**Actor**: 영상 시청자
**Flow**:
1. 영상 상세 페이지에서 "품질 지표" 배지 확인
2. 콘텐츠 품질 점수, 여론 점수, 커뮤니티 품질 점수 한눈에 확인
3. 영상 카테고리 및 대상 청중 파악
4. AI 요약 문구로 영상 내용과 관객 반응 빠르게 이해

**Acceptance Criteria**:
- 3가지 주요 점수 즉시 표시
- 콘텐츠 요약 및 관객 반응 요약 각 100-300자
- 카테고리 및 대상 청중 명확히 표시

### Scenario 3: 관리자가 수동으로 영상 분석 트리거
**Actor**: 시스템 관리자
**Flow**:
1. 개발 페이지(/dev/video-analysis)에서 YouTube URL 또는 videoId 입력
2. 선택적으로 기존 summary ID 입력 (없으면 자동 생성)
3. "영상 품질 분석 시작" 버튼 클릭
4. 분석 결과 실시간 확인 (1-2분 소요)

**Acceptance Criteria**:
- 수동 트리거 방식 (크론 없음)
- 분석 완료 시 모든 지표 표시
- 에러 발생 시 명확한 에러 메시지

---

## 4. Functional Requirements

| ID | Requirement | Description | Priority |
|----|-------------|-------------|----------|
| FR1 | 자막 수집 | summaries 또는 transcripts 테이블에서 자막 텍스트 조회 | HIGH |
| FR2 | 댓글 수집 | 비공식 API로 최근 업데이트 기준 상위 100개 댓글 조회 | HIGH |
| FR3 | 통합 AI 분석 | 자막 + 댓글 100개를 동시에 Gemini 2.0 Flash Exp에 전달 | HIGH |
| FR4 | 콘텐츠 품질 분석 | 자막 기반으로 교육적 가치, 재미, 정확성, 명확성, 깊이 평가 (0-100) | HIGH |
| FR5 | 여론 분석 | 댓글 기반으로 긍정/중립/부정 비율, 감정 강도 측정 | HIGH |
| FR6 | 커뮤니티 품질 분석 | 댓글 말투로 예의, 독성, 건설성 등 평가 (0-100) | HIGH |
| FR7 | 나이대 분석 | 댓글 말투 기반 10대/20대/30대/40대+ 비율 추정 | HIGH |
| FR8 | 종합 요약 생성 | 콘텐츠 요약, 관객 반응 요약, 주요 인사이트, 개선 제안 생성 | HIGH |
| FR9 | 데이터베이스 저장 | 40+ 분석 결과 컬럼을 summaries 테이블에 저장 | HIGH |
| FR10 | 수동 트리거 | 관리자가 수동으로 분석 시작 (크론 없음) | HIGH |
| FR11 | 분석 상태 관리 | pending → processing → completed/failed 상태 추적 | HIGH |
| FR12 | Valibot 스키마 검증 | AI 출력 구조 검증 (점수 범위, 비율 합계 등) | HIGH |
| FR13 | Summary 자동 생성 | summaryId 미제공 시 자동으로 summary 레코드 생성 | MEDIUM |
| FR14 | 카테고리 분류 | 영상을 educational/entertainment/tutorial 등으로 분류 | MEDIUM |
| FR15 | 대상 청중 식별 | general/professional/beginner/advanced/children 구분 | MEDIUM |

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR1 | 성능 | 전체 분석 프로세스 1-2분 이내 완료 |
| NFR2 | 확장성 | 최대 100개 댓글 분석 지원 (고정) |
| NFR3 | AI 모델 | Gemini 2.0 Flash Exp 사용 (빠른 응답, 구조화 출력) |
| NFR4 | 데이터 정확성 | AI 출력 Valibot 스키마 검증 통과율 100% |
| NFR5 | 보안 | 댓글 텍스트만 분석, 개인정보 수집/저장 금지 |
| NFR6 | 재현성 | 동일 입력에 대해 유사한 점수 생성 (temperature 0.3) |
| NFR7 | 스키마 검증 | 모든 점수 0-100 범위, 비율 합계 100 보장 |
| NFR8 | 에러 처리 | AI 분석 실패 시 명확한 에러 메시지 반환 |
| NFR9 | 데이터베이스 효율 | 단일 UPDATE 쿼리로 40+ 컬럼 원자적 갱신 |
| NFR10 | 상태 추적 | 분석 상태를 pending/processing/completed/failed로 명확히 관리 |

---

## 6. Success Criteria

- **분석 완료율**: 영상 분석 요청 시 95% 이상 정상 완료
- **스키마 검증 통과율**: AI 출력이 100% Valibot 스키마 검증 통과
- **통합 분석 효과**: 자막+댓글 동시 분석으로 일관성 있는 품질 평가
- **성능**: 전체 분석 프로세스 1-2분 이내 완료
- **데이터 무결성**: 40+ 컬럼이 원자적으로 업데이트되어 부분 저장 없음
- **분석 시점 기록**: analyzed_at 타임스탬프 정확히 기록되어 데이터 신선도 추적 가능

---

## 7. Key Entities

### Summaries Table (분석 결과 저장)
모든 분석 결과는 `zheon.summaries` 테이블에 저장됩니다. 주요 컬럼:

```typescript
// A. Content Quality (자막 기반, 0-100)
content_quality_score: number
content_educational_value: number
content_entertainment_value: number
content_information_accuracy: number
content_clarity: number
content_depth: number
content_category: 'educational' | 'entertainment' | 'tutorial' | 'vlog' | 'review' | 'news' | 'gaming' | 'music' | 'other'
content_target_audience: 'general' | 'professional' | 'beginner' | 'advanced' | 'children'

// B. Sentiment Analysis (댓글 기반, 0-100)
sentiment_overall_score: number
sentiment_positive_ratio: number
sentiment_neutral_ratio: number
sentiment_negative_ratio: number
sentiment_intensity: number

// C. Community Quality (댓글 말투, 0-100)
community_quality_score: number
community_politeness: number
community_rudeness: number
community_kindness: number
community_toxicity: number
community_constructive: number
community_self_centered: number
community_off_topic: number

// D. Age Group Analysis (댓글 말투, 0-100)
age_group_teens: number
age_group_20s: number
age_group_30s: number
age_group_40plus: number

// E. AI Metadata
ai_content_summary: string       // 콘텐츠 요약 (100-300자)
ai_audience_reaction: string     // 관객 반응 요약 (100-300자)
ai_key_insights: jsonb          // 주요 발견사항 (최대 5개)
ai_recommendations: jsonb       // 개선 제안 (최대 3개)
total_comments_analyzed: number
analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
analyzed_at: timestamptz
analysis_model: string          // 'gemini-2.0-flash-exp'
```

### YouTube Comments Table (수집 데이터)
댓글 원본 데이터는 `zheon.youtube_comments` 테이블에 저장됩니다:

```typescript
{
  id: string                    // YouTube comment ID (PK)
  video_id: string
  text: string
  author: string
  author_channel_id: string
  like_count: number
  reply_count: number
  is_reply: boolean
  parent_comment_id: string | null
  published_at_relative: string // "21시간전" 등
  updated_at: timestamptz
}
```

### Analysis Request (analyzeVideoQuality 파라미터)
```typescript
{
  videoId: string     // YouTube 영상 ID (필수)
  summaryId?: string  // 기존 summary ID (선택, 없으면 자동 생성)
}
```

---

## 8. Assumptions

- YouTube 비공식 API 접근 가능 (TOR 프록시 통해 구성됨)
- Gemini 2.0 Flash Exp API 사용 가능 (Vercel AI SDK 통합 완료)
- 자막 데이터가 summaries 또는 transcripts 테이블에 존재
- 댓글은 공개 데이터만 처리 (비공개 댓글 제외)
- 품질 점수는 AI 기반 정량적 평가 (주관적 요소 포함)
- 분석은 수동 트리거 방식 (자동 스케줄링 없음)
- Comment ID는 전 영상에서 고유하고 변하지 않음 (YouTube 보증)
- 댓글 텍스트는 불변 (삭제/수정 시 새 ID 생성)
- 100개 댓글 샘플로 커뮤니티 전체를 대표 가능
- AI 출력은 Valibot 스키마 검증을 항상 통과 (temperature 0.3로 안정성 확보)

---

## 9. Constraints & Limitations

- **TOR 프록시 의존성**: 비공식 API 호출은 TOR 프록시 필요 (프록시 장애 시 댓글 수집 불가)
- **댓글 수 고정**: 최근 업데이트 기준 100개 댓글만 분석 (고정, 확장 불가)
- **언어 제한**: Gemini 모델의 한국어/영어 성능 중심 (다른 언어는 정확도 낮을 수 있음)
- **AI 주관성**: AI 평가는 정량적이지만 주관적 요소 포함 (절대적 진실 아님)
- **수동 트리거 전용**: 자동 스케줄링 없음 (관리자 수동 실행만 가능)
- **자막 필수**: 자막이 없으면 콘텐츠 품질 분석 불가능
- **댓글 타임스탬프 부재**: YouTube API가 상대 시간만 제공 ("21시간전" 등)
- **처리 시간**: Gemini API 호출로 1-2분 소요 (즉시 응답 불가)
- **비용**: Gemini API 호출 비용 발생 (무제한 분석 불가)
- **스키마 검증 의존성**: Valibot 검증 실패 시 분석 전체 실패

---

## 10. Edge Cases

- **자막 없음**: summaries.summary도 없고 transcripts 테이블에도 없는 경우 → 에러 반환
- **댓글 없음**: 댓글이 0개인 경우 → 빈 배열로 분석 시도 (AI가 "분석 불가" 응답 생성)
- **100개 미만 댓글**: 전체 댓글 수집하여 분석 (패딩 없음)
- **매우 긴 댓글**: Gemini의 컨텍스트 윈도우 내에서 처리 (자동 잘림)
- **이모지/이미지 전용 댓글**: AI가 맥락 기반으로 최선 추정
- **Gemini API 실패**: 에러 메시지 반환, analysis_status를 'failed'로 설정
- **Valibot 검증 실패**: 에러 메시지 반환, 데이터베이스 업데이트 없음
- **summaryId 없음**: 자동으로 summary 레코드 생성 후 분석
- **비율 합계 오류**: Valibot이 자동 검증 (sentiment/age_groups 합계 != 100 거부)
- **동일 영상 중복 분석**: 마지막 분석 결과로 덮어씀 (UPSERT 방식)
- **TOR 프록시 장애**: 댓글 수집 실패 → 전체 분석 실패

---

## 11. Out of Scope

- 댓글 작성자의 채널 신뢰도 개별 분석
- 댓글 번역 기능 (AI가 다국어 지원하지만 공식 번역은 아님)
- 실시간 스트림 댓글 분석
- 댓글에 대한 자동 응답 생성
- 댓글 모더레이션 자동화
- 증분 분석 (매일 신규 댓글만 분석)
- 자동 스케줄링 (크론 작업 없음)
- 댓글 감정 변화 추적 (시계열 분석 없음)
- 개별 댓글 점수화 (전체 커뮤니티만 평가)
- UI 자동 표시 (현재는 개발 페이지에서만 테스트)

---

## 12. Implementation Notes

- **트리거 방식**: 수동 트리거 전용 - `/dev/video-analysis` 페이지에서 관리자가 직접 실행
- **통합 분석**: 자막과 댓글을 하나의 Gemini API 호출로 동시 분석 (일관성 확보)
- **AI 모델**: Gemini 2.0 Flash Exp (빠른 응답, 구조화 출력 지원)
- **스키마 검증**: Vercel AI SDK의 `generateObject()` + Valibot 스키마로 타입 안전성 보장
- **데이터 소스**:
  - 자막: `summaries.summary` (우선) → `transcripts.segments` (대체)
  - 댓글: `youtube_comments` 테이블에서 `updated_at DESC` 기준 100개
- **저장 방식**: 단일 UPDATE 쿼리로 40+ 컬럼 원자적 갱신
- **에러 처리**: Gemini 또는 Valibot 실패 시 `analysis_status = 'failed'` 설정
- **Temperature 설정**: 0.3으로 고정 (재현성과 일관성 우선)

---

## 13. Implementation Phases

### Phase 1: 데이터베이스 스키마 설계 (2025-10-28, Completed)
- 40+ 분석 결과 컬럼 설계 및 연구
- `zheon.summaries` 테이블에 분석 컬럼 추가
- 0-100 범위 제약, 인덱스, COMMENT 추가
- Migration: `20251028120000_add_video_analysis_columns.sql`

### Phase 2: AI 프롬프트 및 스키마 설계 (2025-10-28, Completed)
- Gemini용 분석 프롬프트 템플릿 작성 (`video-analysis-prompt.js`)
- Valibot 스키마 정의 (점수 범위, 비율 합계 검증)
- 4개 분석 영역 명확히 정의 (콘텐츠/여론/커뮤니티/나이대)
- 100-300자 요약, 최대 5개 인사이트, 최대 3개 제안

### Phase 3: 분석 로직 구현 (2025-10-28, Completed)
- `analyzeVideoQuality` command 함수 구현 (`ai.remote.js`)
- 자막 + 댓글 100개 조회 로직
- Gemini 2.0 Flash Exp API 호출
- Valibot 검증 및 데이터베이스 저장
- 에러 처리 (자막 없음, API 실패, 검증 실패)

### Phase 4: 테스트 UI 구현 (2025-10-28, Completed)
- `/dev/video-analysis` 개발 페이지 생성
- YouTube URL/videoId 입력 폼
- 분석 결과 표시 (4개 카드 + 요약/인사이트/제안)
- 분석 진행 상태 표시
- 에러 메시지 표시

### Phase 5: 통합 테스트 및 문서화 (2025-10-28, Completed)
- Migration 적용 및 검증
- 스펙 문서 업데이트 (version 1.0 → 2.0)
- 기능 명세서 보완 (`.specify/features/` 디렉토리)

### Phase 6: 프로덕션 UI 통합 (Pending)
- 영상 상세 페이지에 품질 지표 배지 표시
- 차트/그래프로 감정 분포 시각화
- 나이대 분포 시각화
- 주요 인사이트 및 제안 표시
