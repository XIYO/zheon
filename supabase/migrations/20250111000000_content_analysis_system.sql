-- Content Analysis System v6.1 Final
-- Created: 2025-01-11
-- Tables: categories, video_categories, tags, video_tags, content_metric_keys, content_metrics

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
