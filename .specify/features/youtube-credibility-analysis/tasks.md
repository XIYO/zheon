# Implementation Tasks: YouTube 영상 댓글 분석 (커뮤니티 감정도)

**Version**: 1.0
**Created**: 2025-10-18
**Status**: Ready for Implementation

---

## Task Overview

Total Tasks: 42
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (User Story 1 - Creator): 8 tasks
- Phase 4 (User Story 2 - Viewer): 7 tasks
- Phase 5 (User Story 3 - Admin): 6 tasks
- Phase 6 (Polish & Deployment): 7 tasks

Parallel Opportunities: 15 tasks marked [P]
MVP Scope: Phase 1 + Phase 2 + Phase 3

---

## Phase 1: Setup & Infrastructure

### Goal
Prepare database schema, establish Edge Function structure, and configure API connections.

### Test Criteria
- All database migrations execute without errors
- Edge Function directory structure created
- API credentials configured and tested
- Type definitions generated and accessible

### Tasks

- [x] T001 Create database migration for youtube_comments table in supabase/migrations/youtube_comments.sql
- [x] T002 Create database migration for comment_metadata_history table in supabase/migrations/comment_metadata_history.sql
- [x] T003 Create database migration for comment_collection_state table in supabase/migrations/comment_collection_state.sql
- [x] T004 Create Edge Function directory structure: supabase/functions/{collect-comments,analyze-sentiment,analyze-captions,analyze-video-comments,_shared}/
- [x] T005 [P] Create shared types file: supabase/functions/_shared/types.ts (Comment, VideoInsight, AnalysisResult interfaces)
- [x] T006 [P] Create shared database utilities: supabase/functions/_shared/db.ts (Supabase client, connection helpers)

---

## Phase 2: Foundational - Comment Collection Infrastructure

### Goal
Implement robust comment collection, deduplication, and state tracking to enable daily incremental collection.

### Test Criteria
- Can collect 100 recent comments from any YouTube video
- Deduplicates comments correctly using Comment ID
- Tracks collection state for next incremental run
- Metadata history recorded for each collection

### Tasks

- [x] T007 [P] Implement youtubei.js wrapper: supabase/functions/_shared/youtube-api.ts
  - NEWEST_FIRST sorting support
  - Boundary detection using Comment ID
  - Error handling for rate limits

- [x] T008 [P] Create comment collection function: supabase/functions/collect-comments/collection.ts
  - Load collection state from DB
  - Fetch comments until boundary or 1000 limit
  - Handle incomplete batch scenarios

- [x] T009 Create deduplication logic: supabase/functions/collect-comments/deduplication.ts
  - UPSERT by comment_id (Comment ID primary key)
  - Source priority handling (official > unofficial)
  - Update metadata if comment already exists

- [x] T010 [P] Create metadata history recording: supabase/functions/collect-comments/metadata-history.ts
  - Track like_count, reply_count at collection time
  - Calculate change magnitude (small/medium/large)
  - Store in comment_metadata_history table

- [x] T011 Create collection state management: supabase/functions/collect-comments/state.ts
  - Load/save last_collected_ids
  - Update last_collection_time
  - Track total_comments_collected

- [x] T012 Create main collect-comments function: supabase/functions/collect-comments/index.ts
  - Orchestrate collection → deduplication → state update
  - Return collected count and statistics

- [x] T013 [P] Create type definitions for collection: supabase/functions/_shared/collection-types.ts
  - CollectionState, CommentData, MetadataHistory types
  - Zod schemas for validation

- [ ] T014 Test comment collection end-to-end with real YouTube video
  - Verify 100 comments collected
  - Confirm deduplication works on re-run
  - Check state updated correctly

---

## Phase 3: User Story 1 - Creator View: Comprehensive Credibility Analysis

### Story
As a content creator, I want to view detailed credibility analysis of my video including emotion score, sentiment distribution, suspicious comments, and community trends, so I can understand viewer sentiment and make informed content decisions.

### Acceptance Criteria
- Load time < 3 seconds for analysis data
- Emotion score clearly explained (0-100 scale)
- Sentiment distribution displayed visually
- Suspicious comment ratio shown
- Daily trend visible for past 7 days

### Tasks

- [x] T015 [P] Implement batch sentiment analysis function: supabase/functions/analyze-sentiment/batch-analyze.ts
  - Filter only unanalyzed comments (sentiment IS NULL)
  - Batch into 100-comment chunks
  - Call Gemini API once per batch with JSON schema
  - Store results with sentiment + confidence for each comment
  - Skip if no new comments found

- [x] T016 [P] Create emotion score calculation: supabase/functions/analyze-sentiment/emotion-score.ts
  - Load ALL analyzed comments from DB (regardless of collection date)
  - Calculate community_emotion_score = (positive count / total) * 100
  - Calculate sentiment distribution percentages (all comments in pool)
  - Track daily change vs previous analysis
  - Calculate 7-day trend from historical emotion_scores

- [x] T017 Create Insight JSON builder: supabase/functions/_shared/insights.ts
  - Structure comment_analysis section with metadata, current_emotion, trend
  - Include total_comments_analyzed, analyzed_at, data_freshness_hours
  - Build trend structure with daily_change, previous_score, trend_7_days, trend_direction

- [x] T018 [P] Create main analyze-sentiment function: supabase/functions/analyze-sentiment/index.ts
  - Load all comments from DB (max 1000 for video)
  - Call batchAnalyzeSentimentForTrend for batch processing
  - Store analysis results back to youtube_comments table
  - Return emotion score and distribution

- [x] T019 Create suspicious comment detection: supabase/functions/analyze-sentiment/suspicious-detection.ts
  - Implement heuristics: spam patterns, misinformation markers, suspicious ratios
  - Calculate suspicion score (0-1) for each comment
  - Flag comments with score > 0.7
  - Store suspicion data for UI filtering

- [x] T020 [P] Create Insight auto-injection: supabase/functions/analyze-video-comments/insight-merge.ts
  - Merge comment_analysis + caption_analysis into single video_insight JSON
  - Add combined_credibility section
  - Handle partial success (if one analysis fails)
  - Update videos.video_insight column

- [x] T021 Create data freshness tracking: supabase/functions/analyze-sentiment/freshness.ts
  - Calculate hours since analyzed_at to now
  - Generate human-readable string ("2시간 전")
  - Store last_analyzed_at timestamp
  - Check if data expires after 24 hours

- [ ] T022 Test sentiment analysis with 1000 real comments
  - Verify Gemini API returns expected format
  - Confirm sentiment distribution totals 100%
  - Check trend calculation accuracy
  - Validate Insight JSON structure

---

## Phase 4: User Story 2 - Viewer View: Quick Community Credibility Badge

### Story
As a video viewer, I want to see a quick community credibility badge before watching, and optionally view detailed analysis, so I can make informed decisions about video trustworthiness.

### Acceptance Criteria
- Credibility badge displays immediately
- Badge color-coded by emotion score (green/yellow/red)
- Main opinion summary in single sentence
- "View Details" link opens full analysis modal

### Tasks

- [ ] T023 [P] Create EmotionBadge Svelte component: src/lib/components/video-analysis/EmotionBadge.svelte
  - Display emotion score (0-100) with color coding
  - Green: 70-100 (positive community)
  - Yellow: 40-69 (mixed)
  - Red: 0-39 (negative)
  - Show score number and brief label

- [ ] T024 [P] Create EmotionChart Svelte component: src/lib/components/video-analysis/EmotionChart.svelte
  - Display sentiment distribution (positive/neutral/negative) as bar or pie chart
  - Use existing chart library if available
  - Include percentage labels
  - Show total comments analyzed

- [ ] T025 [P] Create DataFreshness Svelte component: src/lib/components/video-analysis/DataFreshness.svelte
  - Display "Last analyzed: 2 hours ago"
  - Update freshness every minute
  - Show warning if data older than 24 hours
  - Link to re-run analysis if needed

- [ ] T026 [P] Create VideoInsightCard Svelte component: src/lib/components/video-analysis/VideoInsightCard.svelte
  - Composite component showing badge + chart + freshness
  - Responsive design for mobile
  - Loading state while analysis pending
  - Error state if analysis failed

- [ ] T027 Create video insight API endpoint: src/routes/api/videos/[videoId]/insight/+server.ts
  - Fetch video_insight from videos table
  - Return comment_analysis section
  - Cache response for 1 hour
  - Handle missing data gracefully

- [ ] T028 Integrate insight components into video detail page: src/routes/videos/[videoId]/+page.svelte
  - Load insight data via API
  - Render VideoInsightCard component
  - Add "View Full Analysis" link
  - Handle loading/error states

- [ ] T029 Test UI components with mock data
  - Verify badge colors render correctly
  - Confirm chart displays accurately
  - Check freshness updates in real-time
  - Test responsive layout on mobile

---

## Phase 5: User Story 3 - Admin: Background Analysis Monitoring

### Story
As a system administrator, I want to monitor ongoing comment analyses, view completion statistics, and manually trigger re-analysis if needed, so I can ensure system health and manage analysis queue.

### Acceptance Criteria
- Real-time analysis progress display (% complete)
- Error logs clearly visible and searchable
- Manual re-trigger button works for any video
- Analysis statistics dashboard shows success rate

### Tasks

- [ ] T030 [P] Create analysis status tracking: supabase/functions/_shared/status-tracking.ts
  - Store analysis_status in video_insight: pending/in_progress/completed/failed
  - Update status as pipeline progresses
  - Log error details if failed
  - Track start_time, end_time, duration

- [ ] T031 [P] Create admin dashboard API: src/routes/api/admin/analyses/+server.ts
  - List all recent video analyses with status
  - Show completion %, error count, duration
  - Support filtering by status, date range
  - Return paginated results

- [ ] T032 Create analysis re-trigger endpoint: src/routes/api/admin/analyses/[videoId]/retry/+server.ts
  - Validate videoId and admin permissions
  - Reset analysis_status to pending
  - Invoke analyze-video-comments function
  - Return job ID for tracking

- [ ] T033 [P] Create AdminAnalysisMonitor Svelte component: src/lib/components/admin/AnalysisMonitor.svelte
  - Display table of recent analyses
  - Show status badges (green/yellow/red)
  - Display progress bars for in_progress status
  - Include error details in expandable rows

- [ ] T034 [P] Create AdminDashboard page: src/routes/admin/analyses/+page.svelte
  - Render AnalysisMonitor component
  - Add filters (status, date range, video)
  - Include "Retry Failed" bulk action
  - Show statistics panel (success rate, avg duration)

- [ ] T035 Test admin endpoints with mock videos
  - Verify status transitions correct
  - Confirm error logging works
  - Test re-trigger functionality
  - Check pagination with large datasets

---

## Phase 6: Parallel Execution & Integration

### Goal
Implement parallel comment + caption analysis, auto-trigger on video analysis, and ensure system reliability.

### Test Criteria
- Parallel execution reduces time by 1.8x vs sequential
- Auto-trigger fires on video analysis request
- Promise.allSettled handles partial failures
- No data loss on failure

### Tasks

- [ ] T036 [P] Create main orchestration function: supabase/functions/analyze-video-comments/index.ts
  - Accept videoId parameter
  - Launch analyzeComments() and analyzeCaptions() in parallel
  - Use Promise.allSettled for independent failure handling
  - Merge results into single insight JSON
  - Update video_insight with timestamp

- [ ] T037 [P] Implement error recovery for analyze-video-comments: supabase/functions/analyze-video-comments/error-handling.ts
  - Fallback to existing insight if analysis fails
  - Log errors to console and error tracking
  - Return partial success if one analysis fails
  - Implement exponential backoff for retries

- [ ] T038 Create auto-trigger integration: src/routes/api/videos/analyze/+server.ts
  - Hook into existing video analysis endpoint
  - After main analysis completes, invoke analyze-video-comments
  - Use waitUntil for background execution (no blocking)
  - Return immediately to client

- [ ] T039 [P] Add environment configuration: supabase/.env.local
  - YouTube API credentials
  - Gemini API key
  - Supabase connection string
  - Log levels and feature flags

- [ ] T040 [P] Create monitoring and logging: supabase/functions/_shared/logging.ts
  - Structured logging with timestamps
  - Error severity levels (debug/info/warn/error)
  - Performance metrics (API call duration, batch size)
  - Cost tracking (API calls per day)

- [ ] T041 Create end-to-end test scenario: tests/e2e/video-analysis.spec.ts
  - Pick real YouTube video
  - Run complete analysis pipeline
  - Verify all data stored correctly
  - Check UI renders expected results

- [ ] T042 Deploy and monitor production
  - Deploy Edge Functions to production
  - Run smoke tests on production data
  - Monitor Gemini API costs
  - Track analysis success rate for 1 week

---

## Dependency Graph

```
Phase 1 (Setup) → All Phases (Foundation)
    ├─ T001-T003 (Migrations)
    └─ T004-T006 (Function Structure)

Phase 2 (Collection) → Phase 3, 4, 5, 6 (All depend on collected data)
    ├─ T007-T008 (API + Collection)
    └─ T009-T014 (Dedup + State)

Phase 3 (Creator) ─┐
Phase 4 (Viewer)  ├─ T036-T042 (Integration)
Phase 5 (Admin)   ─┘

Sequential within Phase 3: T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022
Sequential within Phase 4: T023-T026 (parallel) → T027 → T028 → T029
Sequential within Phase 5: T030-T031 (parallel) → T032 → T033-T034 (parallel) → T035

Phase 6 integrates all previous phases.
```

---

## Parallel Execution Opportunities

### Can Run in Parallel

**Phase 2 (Collection Infrastructure)**:
- T005, T006 (Shared utilities) can start immediately after T001-T004
- T007-T008, T013 can run in parallel (independent functions)
- T010, T011 can run in parallel (metadata vs state tracking)

**Phase 3 (Creator Analysis)**:
- T015, T016, T017 can start together (sentiment analysis building blocks)
- T023-T026 in Phase 4 can start after T017 (Insight structure ready)
- T030-T031 in Phase 5 can start after T018 (Status tracking)

**Phase 6 (Integration)**:
- T039-T040 can run in parallel (config + logging)
- T041-T042 should be sequential (test then deploy)

### Estimated Parallelism

- Phase 1: 2 parallel paths (migrations → functions)
- Phase 2: 3 parallel paths (collection, metadata, state)
- Phase 3: 2 parallel paths (sentiment → creator UI)
- Phase 4: 2 parallel paths (viewer UI components)
- Phase 5: 2 parallel paths (status tracking → admin UI)
- Phase 6: 2 parallel paths (environment → error handling → orchestration)

---

## MVP Scope (Minimal Viable Product)

### Essential for MVP
1. Phase 1: All setup tasks (T001-T006) - Required foundation
2. Phase 2: All collection tasks (T007-T014) - Core data gathering
3. Phase 3: Creator analysis pipeline (T015-T022) - Main feature

### Optional for MVP (Can add in v1.1)
- Phase 4: Viewer badge (nice-to-have, can show "Analysis Pending")
- Phase 5: Admin dashboard (internal tool, can use logs)
- Phase 6: Auto-trigger (can be manual initially)
- T023, T024, T025 (UI components) - Can use basic HTML initially

### MVP Timeline
- Phase 1: Day 1-2 (Setup + DB)
- Phase 2: Day 3-4 (Collection infrastructure)
- Phase 3: Day 5-7 (Sentiment analysis + Insight)
- Total: ~1 week for core feature

---

## Success Metrics

Each task completion can be validated against:

- **Collection (T007-T014)**: Collects 1000 comments, deduplicates correctly, state updates
- **Sentiment Analysis (T015-T022)**: Emotion score calculated, trend tracked, Insight generated
- **Creator UI (T023-T029)**: Components render, data loads <3s, responsive design
- **Admin (T030-T035)**: Dashboard shows status, re-trigger works
- **Integration (T036-T042)**: Parallel execution 1.8x faster, auto-trigger fires

---

## Implementation Strategy

### Build Order for Maximum Parallelism

1. **Days 1-2**: Phase 1 (Setup) - SEQUENTIAL (foundation)
   - Creates all preconditions

2. **Days 3-4**: Phase 2 (Collection) - PARALLEL in 3 groups
   - Group A: T007-T008 (API wrapper + collection)
   - Group B: T009-T011 (Dedup + metadata + state)
   - Group C: T013-T014 (Types + testing)

3. **Days 5-7**: Phase 3 (Creator Analysis) - PARALLEL in 2 groups
   - Group A: T015-T016 (Sentiment analysis + emotion scoring)
   - Group B: T017-T022 (Insight building + suspicious detection + testing)

4. **Days 8-9**: Phase 4 (Viewer UI) - PARALLEL in 2 groups
   - Group A: T023-T026 (UI components)
   - Group B: T027-T029 (API + integration + testing)

5. **Days 9-10**: Phase 5 (Admin) - PARALLEL in 2 groups
   - Group A: T030-T032 (Status tracking + API)
   - Group B: T033-T035 (Components + testing)

6. **Days 11**: Phase 6 (Integration) - SEQUENTIAL then PARALLEL
   - T036-T040 (Orchestration + env setup)
   - T041-T042 (Testing + deployment)

### Total Timeline: ~2 weeks (11 days) for complete feature

---

## Notes for Implementation

### Important Considerations

1. **Comment ID as Primary Key**: Ensure UPSERT uses comment_id correctly (FR11)
2. **Batch Size**: Gemini API prompt length - test with 100 comments per batch
3. **Data Freshness**: Must track analyzed_at to show "2 hours ago" (FR15)
4. **Trend Calculation**: Need to reanalyze ALL comments daily for accurate trend (not just new ones)
5. **Error Handling**: Use Go-style error returns per project standards
6. **No Tests**: Specification did not request automated tests; use manual testing

### Migration Path

- Existing video_insight column must support JSON
- Comment table structure must enforce PRIMARY KEY on comment_id
- No schema breaking changes to existing tables

---
