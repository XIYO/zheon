# 영상 콘텐츠 분석 시스템 - 최종 통합 문서

**작성일**: 2025-01-11 **버전**: v6.1 Final **스키마**: public **DBMS**: PostgreSQL 14+ (Supabase)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [데이터베이스 스키마](#2-데이터베이스-스키마)
3. [UPSERT 전략](#3-upsert-전략)
4. [LLM 통합 가이드](#4-llm-통합-가이드)
5. [전체 분석 파이프라인](#5-전체-분석-파이프라인)
6. [마이그레이션 가이드](#6-마이그레이션-가이드)

---

## 1. 프로젝트 개요

### 목적

YouTube 영상의 내용을 분석하여 구조화된 메타데이터를 제공합니다.

**핵심 기능**:

- 카테고리 자동 분류 (계층 구조)
- 태그 자동 생성 (가중치 포함)
- 내용 특성 분석 (레이더 차트)

**변경 사항 (v6.1)**:

- 영상 품질 평가 → 영상 내용 분석
- `quality_metric_keys` → `content_metric_keys`
- `content_quality_metrics` → `content_metrics`
- 평가 점수 제거 (overall_score, strengths, weaknesses)
- slug 정규화 기능 제거 (LLM이 정확한 slug 반환 전제)

---

## 2. 데이터베이스 스키마

### 테이블 목록

1. **categories** - 콘텐츠 카테고리 마스터 (계층 구조)
2. **video_categories** - 영상-카테고리 N:N 관계
3. **tags** - 콘텐츠 태그 마스터
4. **video_tags** - 영상-태그 N:N 관계 (가중치)
5. **content_metric_keys** - 내용 분석 항목 마스터
6. **content_metrics** - 영상 내용 분석 결과

---

### 2.1 categories - 콘텐츠 카테고리 마스터

#### 스키마

| 컬럼명 | 타입 | 제약조건 | 설명 | 예시값 |
| --- | --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 | `550e8400-...` |
| `name` | text | NOT NULL | 영문 이름 | `Gameplay`, `Programming Tutorial` |
| `name_ko` | text | NOT NULL | 한글 이름 | `게임플레이`, `프로그래밍 튜토리얼` |
| `slug` | text | NOT NULL, UNIQUE | URL 식별자 | `gameplay`, `programming-tutorial` |
| `parent_id` | uuid | NULLABLE, FK → categories(id) ON DELETE CASCADE | 부모 카테고리 ID | `aaa-111` |
| `depth` | integer | NOT NULL, CHECK (depth >= 0) | 계층 깊이 (0=최상위) | `0`, `1`, `2` |
| `path` | text[] | NOT NULL | 경로 (slug 배열) | `{gaming, gameplay, livestream}` |
| `description` | text | NULLABLE | 설명 (LLM 가이드) | `Live gameplay streaming content` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 생성 시각 | `2025-01-11T12:00:00Z` |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 수정 시각 | `2025-01-11T12:00:00Z` |

#### 인덱스

```sql
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories USING GIN(path);
CREATE INDEX idx_categories_depth ON categories(depth);
```

#### 제약조건

```sql
ALTER TABLE categories ADD CONSTRAINT categories_self_reference_check
  CHECK (parent_id != id);

ALTER TABLE categories ADD CONSTRAINT categories_depth_consistency
  CHECK ((parent_id IS NULL AND depth = 0) OR (parent_id IS NOT NULL AND depth > 0));
```

---

### 2.2 video_categories - 영상-카테고리 관계

#### 스키마

| 컬럼명 | 타입 | 제약조건 | 설명 | 예시값 |
| --- | --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 | `550e8400-...` |
| `video_id` | text | NOT NULL, FK → summaries(video_id) ON DELETE CASCADE | 영상 ID | `dQw4w9WgXcQ` |
| `category_id` | uuid | NOT NULL, FK → categories(id) ON DELETE CASCADE | 카테고리 ID | `aaa-333` |
| `priority` | integer | NOT NULL, CHECK (priority > 0) | 우선순위 (1=주, 2=부) | `1`, `2`, `3` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 생성 시각 | `2025-01-11T12:00:00Z` |

#### 인덱스 & 제약조건

```sql
CREATE INDEX idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX idx_video_categories_category_id ON video_categories(category_id);
CREATE INDEX idx_video_categories_priority ON video_categories(video_id, priority);

ALTER TABLE video_categories ADD CONSTRAINT video_categories_unique
  UNIQUE (video_id, category_id);

ALTER TABLE video_categories ADD CONSTRAINT video_categories_priority_unique
  UNIQUE (video_id, priority);
```

---

### 2.3 tags - 콘텐츠 태그 마스터

#### 스키마

| 컬럼명 | 타입 | 제약조건 | 설명 | 예시값 |
| --- | --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 | `550e8400-...` |
| `name` | text | NOT NULL | 영문 이름 | `Game Review`, `Indie Game` |
| `name_ko` | text | NOT NULL | 한글 이름 | `게임리뷰`, `인디게임` |
| `slug` | text | NOT NULL, UNIQUE | URL 식별자 | `game-review`, `indie-game` |
| `description` | text | NULLABLE | 설명 (LLM 가이드) | `Game review and evaluation content` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 생성 시각 | `2025-01-11T12:00:00Z` |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 수정 시각 | `2025-01-11T12:00:00Z` |

#### 인덱스

```sql
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_name_ko ON tags(name_ko);
CREATE INDEX idx_tags_slug ON tags(slug);
```

---

### 2.4 video_tags - 영상-태그 관계

#### 스키마

| 컬럼명 | 타입 | 제약조건 | 설명 | 예시값 |
| --- | --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 | `550e8400-...` |
| `video_id` | text | NOT NULL, FK → summaries(video_id) ON DELETE CASCADE | 영상 ID | `dQw4w9WgXcQ` |
| `tag_id` | uuid | NOT NULL, FK → tags(id) ON DELETE CASCADE | 태그 ID | `tag-001` |
| `weight` | real | NOT NULL, CHECK (weight >= 0 AND weight <= 1) | 가중치 (중요도) | `0.95`, `0.72` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 생성 시각 | `2025-01-11T12:00:00Z` |

#### 인덱스 & 제약조건

```sql
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX idx_video_tags_weight ON video_tags(video_id, weight DESC);

ALTER TABLE video_tags ADD CONSTRAINT video_tags_unique
  UNIQUE (video_id, tag_id);
```

---

### 2.5 content_metric_keys - 내용 분석 항목 마스터

#### 스키마

| 컬럼명 | 타입 | 제약조건 | 설명 | 예시값 |
| --- | --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 | `550e8400-...` |
| `name` | text | NOT NULL, UNIQUE | 키 (언더스코어) | `technical_depth`, `information_density` |
| `name_ko` | text | NOT NULL | 한글 이름 | `기술 깊이`, `정보 밀도` |
| `slug` | text | NOT NULL, UNIQUE | URL 식별자 | `technical-depth`, `information-density` |
| `description` | text | NOT NULL | 설명 (LLM 가이드) | `Depth of technical concept coverage` |
| `metric_type` | text | NOT NULL, DEFAULT 'score' | 지표 타입 | `score`, `rating`, `boolean`, `percentage` |
| `value_range` | jsonb | NOT NULL, DEFAULT '{"min": 0, "max": 100}' | 값 범위 | `{"min": 0, "max": 100}` |
| `category_hint` | text | NULLABLE | 적합한 카테고리 | `education, tutorial` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 생성 시각 | `2025-01-11T12:00:00Z` |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 수정 시각 | `2025-01-11T12:00:00Z` |

#### 인덱스 & 제약조건

```sql
CREATE INDEX idx_metric_keys_name ON content_metric_keys(name);
CREATE INDEX idx_metric_keys_slug ON content_metric_keys(slug);
CREATE INDEX idx_metric_keys_category_hint ON content_metric_keys(category_hint);

ALTER TABLE content_metric_keys ADD CONSTRAINT metric_keys_name_format
  CHECK (name ~ '^[a-z][a-z0-9_]*$');

ALTER TABLE content_metric_keys ADD CONSTRAINT metric_keys_type_check
  CHECK (metric_type IN ('score', 'rating', 'boolean', 'percentage'));
```

#### 초기 시드 데이터

```sql
INSERT INTO content_metric_keys (name, name_ko, slug, description, category_hint) VALUES

-- 교육/튜토리얼용
('technical_depth', '기술 깊이', 'technical-depth', 'Depth of technical concept coverage', 'education,tutorial'),
('tutorial_completeness', '튜토리얼 완성도', 'tutorial-completeness', 'Step-by-step completeness for following along', 'tutorial'),
('beginner_friendliness', '초보자 친화성', 'beginner-friendliness', 'Accessibility for beginners', 'education,tutorial'),
('practical_applicability', '실무 적용도', 'practical-applicability', 'Real-world applicability', 'tutorial,guide'),
('information_density', '정보 밀도', 'information-density', 'Amount of information per unit time', 'education,information'),

-- 엔터테인먼트용
('entertainment_focus', '엔터테인먼트 비중', 'entertainment-focus', 'Entertainment vs information balance', 'gaming,entertainment'),
('gameplay_skill', '플레이 실력', 'gameplay-skill', 'Player skill level displayed', 'gaming,gameplay'),
('commentary_quality', '해설 품질', 'commentary-quality', 'Quality of commentary and explanation', 'gaming,entertainment'),
('viewer_interaction', '시청자 소통', 'viewer-interaction', 'Level of audience engagement', 'livestream,entertainment'),

-- 공통
('conceptual_coverage', '개념 커버리지', 'conceptual-coverage', 'Range of concepts covered', null),
('example_richness', '예시 풍부함', 'example-richness', 'Number and quality of examples provided', null);
```

---

### 2.6 content_metrics - 영상 내용 분석 결과

#### 스키마

| 컬럼명 | 타입 | 제약조건 | 설명 | 예시값 |
| --- | --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 | `550e8400-...` |
| `video_id` | text | NOT NULL, UNIQUE, FK → summaries(video_id) ON DELETE CASCADE | 영상 ID | `dQw4w9WgXcQ` |
| `metrics` | jsonb | NOT NULL, DEFAULT '{}' | 내용 분석 지표 | `{"technical_depth": {"score": 85, "reasoning": "..."}}` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 생성 시각 | `2025-01-11T12:00:00Z` |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 수정 시각 | `2025-01-11T12:00:00Z` |

#### 인덱스

```sql
CREATE INDEX idx_content_metrics_video_id ON content_metrics(video_id);
CREATE INDEX idx_content_metrics_gin ON content_metrics USING GIN(metrics);
```

#### metrics JSONB 구조

```json
{
	"technical_depth": {
		"score": 85,
		"reasoning": "비동기 프로그래밍의 내부 동작까지 깊이 있게 다룸"
	},
	"information_density": {
		"score": 90,
		"reasoning": "10분 영상에 핵심 개념 5개와 예제 3개 포함"
	},
	"practical_applicability": {
		"score": 95,
		"reasoning": "실제 웹 스크래핑 프로젝트에 바로 적용 가능"
	}
}
```

---

### 2.7 ERD

```
summaries (기존)
    ↓ 1:N
video_categories → categories (self-reference)

summaries
    ↓ 1:N
video_tags → tags

summaries
    ↓ 1:1
content_metrics

content_metric_keys (독립, soft reference)
```

---

### 2.8 RLS 정책

모든 테이블 공통:

| 역할            | SELECT | INSERT | UPDATE | DELETE |
| --------------- | ------ | ------ | ------ | ------ |
| `anon`          | ✓      | ✗      | ✗      | ✗      |
| `authenticated` | ✓      | ✗      | ✗      | ✗      |
| `service_role`  | ✓      | ✓      | ✓      | ✓      |

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metric_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role full access" ON categories FOR ALL TO service_role USING (true);
```

---

## 3. UPSERT 전략

### 3.1 카테고리 UPSERT

```typescript
async function upsertCategory(data: {
	slug: string;
	name: string;
	name_ko: string;
	description?: string;
	parent_slug?: string;
}) {
	// 1. 부모 카테고리 조회
	let parent_id: string | null = null;
	let depth = 0;
	let path = [data.slug];

	if (data.parent_slug) {
		const { data: parent } = await supabase
			.from('categories')
			.select('id, depth, path')
			.eq('slug', data.parent_slug)
			.single();

		if (parent) {
			parent_id = parent.id;
			depth = parent.depth + 1;
			path = [...parent.path, data.slug];
		}
	}

	// 2. UPSERT
	const { data: result, error } = await supabase
		.from('categories')
		.upsert(
			{
				slug: data.slug,
				name: data.name,
				name_ko: data.name_ko,
				description: data.description || null,
				parent_id,
				depth,
				path,
				updated_at: new Date().toISOString()
			},
			{
				onConflict: 'slug',
				ignoreDuplicates: false
			}
		)
		.select()
		.single();

	if (error) throw error;
	return result;
}
```

### 3.2 태그 UPSERT

```typescript
async function upsertTag(data: {
	slug: string;
	name: string;
	name_ko: string;
	description?: string;
}) {
	const { data: result, error } = await supabase
		.from('tags')
		.upsert(
			{
				slug: data.slug,
				name: data.name,
				name_ko: data.name_ko,
				description: data.description || null,
				updated_at: new Date().toISOString()
			},
			{
				onConflict: 'slug',
				ignoreDuplicates: false
			}
		)
		.select()
		.single();

	if (error) throw error;
	return result;
}
```

### 3.3 분석 항목 UPSERT

```typescript
async function upsertMetricKey(data: {
	slug: string;
	name: string;
	name_ko: string;
	description: string;
	metric_type?: string;
	category_hint?: string;
}) {
	const { data: result, error } = await supabase
		.from('content_metric_keys')
		.upsert(
			{
				slug: data.slug,
				name: data.name,
				name_ko: data.name_ko,
				description: data.description,
				metric_type: data.metric_type || 'score',
				category_hint: data.category_hint || null,
				value_range: { min: 0, max: 100 },
				updated_at: new Date().toISOString()
			},
			{
				onConflict: 'slug',
				ignoreDuplicates: false
			}
		)
		.select()
		.single();

	if (error) throw error;
	return result;
}
```

---

## 4. LLM 통합 가이드

### 4.1 카테고리 분류 프롬프트

```typescript
const existingCategories = await supabase
	.from('categories')
	.select('slug, name, name_ko, description, depth, path')
	.order('depth', { ascending: true });

const categoryTree = buildTree(existingCategories);

const prompt = `
# 기존 카테고리 목록

${formatCategoryTree(categoryTree)}

예시:
- gaming (게임)
  - gameplay (게임플레이)
    - livestream (실황 방송)
  - review (리뷰)

# 분류 규칙

1. 위 카테고리 중 80% 이상 일치하면 반드시 기존 것 사용
2. slug는 영문 소문자 + 하이픈 형식으로 작성
3. 새 카테고리 생성은 정말 필요할 때만

# 영상 정보

제목: ${video.title}
자막: ${transcript}

# 출력 형식

{
  "categories": [
    {
      "use_existing": true,
      "slug": "gameplay",
      "reasoning": "실시간 게임 플레이 영상"
    }
  ]
}

또는 새로 생성:

{
  "categories": [
    {
      "use_existing": false,
      "slug": "game-development",
      "name": "Game Development",
      "name_ko": "게임 개발",
      "description": "Game creation and development content",
      "parent_slug": "gaming"
    }
  ]
}
`;
```

### 4.2 태그 생성 프롬프트

```typescript
const popularTags = await supabase.from('tags').select('slug, name, name_ko').limit(100);

const prompt = `
# 기존 태그 목록 (인기순 100개)

${popularTags.map((t) => `- ${t.slug} (${t.name} / ${t.name_ko})`).join('\n')}

# 태그 생성 규칙

1. 위 태그와 70% 이상 유사하면 기존 것 사용
2. slug는 영문 소문자 + 하이픈 형식
3. 5~15개 태그 생성
4. weight는 중요도 순으로 0.1~1.0

# 출력 형식

{
  "tags": [
    {
      "use_existing": true,
      "slug": "game-review",
      "weight": 0.95
    },
    {
      "use_existing": false,
      "slug": "roguelike",
      "name": "Roguelike",
      "name_ko": "로그라이크",
      "description": "Roguelike game genre",
      "weight": 0.78
    }
  ]
}
`;
```

### 4.3 내용 분석 프롬프트

```typescript
const metricKeys = await supabase
	.from('content_metric_keys')
	.select('slug, name, name_ko, description')
	.order('created_at');

const prompt = `
# 영상 내용 분석

다음 지표로 영상의 내용 특성을 분석하세요.
(품질 평가가 아닌, 내용의 특징을 측정)

## 기존 지표

${metricKeys.map((k) => `- ${k.slug} (${k.name_ko}): ${k.description}`).join('\n')}

## 영상 정보

제목: ${video.title}
자막: ${transcript}

## 출력 형식

{
  "metric_keys": [
    {
      "use_existing": true,
      "slug": "technical-depth"
    },
    {
      "use_existing": false,
      "slug": "code-quality",
      "name": "code_quality",
      "name_ko": "코드 품질",
      "description": "Quality of code examples shown"
    }
  ],
  "metrics": {
    "technical_depth": {
      "score": 85,
      "reasoning": "비동기 프로그래밍의 내부 동작까지 깊이 있게 다룸"
    },
    "code_quality": {
      "score": 88,
      "reasoning": "코드 예시가 깔끔하고 best practice를 따름"
    }
  }
}

# 주의사항

- "좋다/나쁘다" 평가 금지
- 객관적 특성만 측정
- 점수는 "얼마나 그 특성을 가지는가"의 정도
`;
```

---

## 5. 전체 분석 파이프라인

### Edge Function: analyze-video

```typescript
// supabase/functions/analyze-video/index.ts

import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const supabase = createClient(
	Deno.env.get('SUPABASE_URL'),
	Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
	const { video_id } = await req.json();

	// 1. 영상 정보 조회
	const { data: summary } = await supabase
		.from('summaries')
		.select('title, summary')
		.eq('video_id', video_id)
		.single();

	// 2. 기존 데이터 조회
	const [categories, tags, metricKeys] = await Promise.all([
		supabase.from('categories').select('slug, name, name_ko, description'),
		supabase.from('tags').select('slug, name, name_ko').limit(100),
		supabase.from('content_metric_keys').select('slug, name_ko, description')
	]);

	// 3. LLM 분석
	const { text } = await generateText({
		model: google('gemini-2.5-flash-lite'),
		prompt: buildAnalysisPrompt(summary, categories.data, tags.data, metricKeys.data)
	});

	const analysis = JSON.parse(text);

	// 4. 카테고리 UPSERT
	console.time('Upsert categories');
	const categoryIds = [];
	for (const cat of analysis.categories) {
		if (!cat.use_existing) {
			const result = await upsertCategory({
				slug: cat.slug,
				name: cat.name,
				name_ko: cat.name_ko,
				description: cat.description,
				parent_slug: cat.parent_slug
			});
			categoryIds.push(result.id);
		} else {
			const { data } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();
			categoryIds.push(data.id);
		}
	}
	console.timeEnd('Upsert categories');

	// 5. 태그 UPSERT
	console.time('Upsert tags');
	const tagIds = [];
	for (const tag of analysis.tags) {
		if (!tag.use_existing) {
			const result = await upsertTag({
				slug: tag.slug,
				name: tag.name,
				name_ko: tag.name_ko,
				description: tag.description
			});
			tagIds.push({ id: result.id, weight: tag.weight });
		} else {
			const { data } = await supabase.from('tags').select('id').eq('slug', tag.slug).single();
			tagIds.push({ id: data.id, weight: tag.weight });
		}
	}
	console.timeEnd('Upsert tags');

	// 6. 분석 항목 UPSERT
	console.time('Upsert metric keys');
	for (const key of analysis.metric_keys) {
		if (!key.use_existing) {
			await upsertMetricKey({
				slug: key.slug,
				name: key.name,
				name_ko: key.name_ko,
				description: key.description
			});
		}
	}
	console.timeEnd('Upsert metric keys');

	// 7. video_categories 삽입
	await supabase.from('video_categories').delete().eq('video_id', video_id);
	await supabase.from('video_categories').insert(
		categoryIds.map((id, i) => ({
			video_id,
			category_id: id,
			priority: i + 1
		}))
	);

	// 8. video_tags 삽입
	await supabase.from('video_tags').delete().eq('video_id', video_id);
	await supabase.from('video_tags').insert(
		tagIds.map(({ id, weight }) => ({
			video_id,
			tag_id: id,
			weight
		}))
	);

	// 9. content_metrics 삽입
	await supabase.from('content_metrics').upsert({
		video_id,
		metrics: analysis.metrics
	});

	return new Response(JSON.stringify({ success: true }));
});
```

---

## 6. 마이그레이션 가이드

### 6.1 새로운 데이터베이스 (from scratch)

```sql
-- 1. categories 테이블
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ko text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  depth integer NOT NULL CHECK (depth >= 0),
  path text[] NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories USING GIN(path);
CREATE INDEX idx_categories_depth ON categories(depth);

ALTER TABLE categories ADD CONSTRAINT categories_self_reference_check
  CHECK (parent_id != id);
ALTER TABLE categories ADD CONSTRAINT categories_depth_consistency
  CHECK ((parent_id IS NULL AND depth = 0) OR (parent_id IS NOT NULL AND depth > 0));

-- 2. video_categories 테이블
CREATE TABLE video_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL REFERENCES summaries(video_id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  priority integer NOT NULL CHECK (priority > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, category_id),
  UNIQUE (video_id, priority)
);

CREATE INDEX idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX idx_video_categories_category_id ON video_categories(category_id);
CREATE INDEX idx_video_categories_priority ON video_categories(video_id, priority);

-- 3. tags 테이블
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ko text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_name_ko ON tags(name_ko);
CREATE INDEX idx_tags_slug ON tags(slug);

-- 4. video_tags 테이블
CREATE TABLE video_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL REFERENCES summaries(video_id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  weight real NOT NULL CHECK (weight >= 0 AND weight <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, tag_id)
);

CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX idx_video_tags_weight ON video_tags(video_id, weight DESC);

-- 5. content_metric_keys 테이블
CREATE TABLE content_metric_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name ~ '^[a-z][a-z0-9_]*$'),
  name_ko text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  metric_type text NOT NULL DEFAULT 'score' CHECK (metric_type IN ('score', 'rating', 'boolean', 'percentage')),
  value_range jsonb NOT NULL DEFAULT '{"min": 0, "max": 100}',
  category_hint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_metric_keys_name ON content_metric_keys(name);
CREATE INDEX idx_metric_keys_slug ON content_metric_keys(slug);
CREATE INDEX idx_metric_keys_category_hint ON content_metric_keys(category_hint);

-- 6. content_metrics 테이블
CREATE TABLE content_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE REFERENCES summaries(video_id) ON DELETE CASCADE,
  metrics jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_metrics_video_id ON content_metrics(video_id);
CREATE INDEX idx_content_metrics_gin ON content_metrics USING GIN(metrics);

-- 7. RLS 정책
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metric_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service write" ON categories FOR ALL TO service_role USING (true);

CREATE POLICY "Public read" ON video_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service write" ON video_categories FOR ALL TO service_role USING (true);

CREATE POLICY "Public read" ON tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service write" ON tags FOR ALL TO service_role USING (true);

CREATE POLICY "Public read" ON video_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service write" ON video_tags FOR ALL TO service_role USING (true);

CREATE POLICY "Public read" ON content_metric_keys FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service write" ON content_metric_keys FOR ALL TO service_role USING (true);

CREATE POLICY "Public read" ON content_metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service write" ON content_metrics FOR ALL TO service_role USING (true);

-- 8. 초기 시드 데이터
INSERT INTO content_metric_keys (name, name_ko, slug, description, category_hint) VALUES
('technical_depth', '기술 깊이', 'technical-depth', 'Depth of technical concept coverage', 'education,tutorial'),
('tutorial_completeness', '튜토리얼 완성도', 'tutorial-completeness', 'Step-by-step completeness', 'tutorial'),
('beginner_friendliness', '초보자 친화성', 'beginner-friendliness', 'Accessibility for beginners', 'education,tutorial'),
('practical_applicability', '실무 적용도', 'practical-applicability', 'Real-world applicability', 'tutorial,guide'),
('information_density', '정보 밀도', 'information-density', 'Amount of information per unit time', 'education,information'),
('entertainment_focus', '엔터테인먼트 비중', 'entertainment-focus', 'Entertainment vs information balance', 'gaming,entertainment'),
('gameplay_skill', '플레이 실력', 'gameplay-skill', 'Player skill level displayed', 'gaming,gameplay'),
('commentary_quality', '해설 품질', 'commentary-quality', 'Quality of commentary', 'gaming,entertainment'),
('viewer_interaction', '시청자 소통', 'viewer-interaction', 'Level of audience engagement', 'livestream,entertainment'),
('conceptual_coverage', '개념 커버리지', 'conceptual-coverage', 'Range of concepts covered', null),
('example_richness', '예시 풍부함', 'example-richness', 'Number and quality of examples', null);
```

### 6.2 기존 데이터베이스 (migration)

```sql
-- 1. 테이블 이름 변경
ALTER TABLE quality_metric_keys RENAME TO content_metric_keys;
ALTER TABLE content_quality_metrics RENAME TO content_metrics;

-- 2. content_metrics에서 불필요한 컬럼 제거
ALTER TABLE content_metrics DROP COLUMN IF EXISTS overall_score;
ALTER TABLE content_metrics DROP COLUMN IF EXISTS strengths;
ALTER TABLE content_metrics DROP COLUMN IF EXISTS weaknesses;
ALTER TABLE content_metrics DROP COLUMN IF EXISTS improvement_suggestions;

-- 3. 기존 데이터 정리 (선택)
TRUNCATE content_metric_keys CASCADE;

-- 4. 새로운 시드 데이터 삽입
INSERT INTO content_metric_keys (name, name_ko, slug, description, category_hint) VALUES
('technical_depth', '기술 깊이', 'technical-depth', 'Depth of technical concept coverage', 'education,tutorial'),
('tutorial_completeness', '튜토리얼 완성도', 'tutorial-completeness', 'Step-by-step completeness', 'tutorial'),
('beginner_friendliness', '초보자 친화성', 'beginner-friendliness', 'Accessibility for beginners', 'education,tutorial'),
('practical_applicability', '실무 적용도', 'practical-applicability', 'Real-world applicability', 'tutorial,guide'),
('information_density', '정보 밀도', 'information-density', 'Amount of information per unit time', 'education,information'),
('entertainment_focus', '엔터테인먼트 비중', 'entertainment-focus', 'Entertainment vs information balance', 'gaming,entertainment'),
('gameplay_skill', '플레이 실력', 'gameplay-skill', 'Player skill level displayed', 'gaming,gameplay'),
('commentary_quality', '해설 품질', 'commentary-quality', 'Quality of commentary', 'gaming,entertainment'),
('viewer_interaction', '시청자 소통', 'viewer-interaction', 'Level of audience engagement', 'livestream,entertainment'),
('conceptual_coverage', '개념 커버리지', 'conceptual-coverage', 'Range of concepts covered', null),
('example_richness', '예시 풍부함', 'example-richness', 'Number and quality of examples', null);
```

---

## 7. 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 기존 데이터 조회                                          │
│    - categories: slug, name, name_ko, description           │
│    - tags: slug, name, name_ko                              │
│    - content_metric_keys: slug, name_ko, description        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. LLM에게 제공                                              │
│    - "기존 데이터를 slug 형식으로 사용"                      │
│    - "새로 생성 시 slug 형식(소문자+하이픈) 준수"            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LLM 응답                                                  │
│    {                                                         │
│      "categories": [{"slug": "gameplay", ...}],             │
│      "tags": [{"slug": "indie-game", ...}]                  │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UPSERT (slug 기준)                                        │
│    - ON CONFLICT (slug) → UPDATE                            │
│    - 신규면 INSERT, 기존이면 UPDATE                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 관계 테이블 삽입                                          │
│    - video_categories (video_id, category_id, priority)     │
│    - video_tags (video_id, tag_id, weight)                  │
│    - content_metrics (video_id, metrics)                    │
└─────────────────────────────────────────────────────────────┘
```

---

**문서 버전**: v6.1 Final **최종 확정**: 2025-01-11 **다음 단계**: supabase/migrations/ 생성
