-- name 필드를 디스플레이용 자연스러운 텍스트로 변경
-- snake_case CHECK constraint 제거

ALTER TABLE content_metric_keys
DROP CONSTRAINT content_metric_keys_name_check;

-- 기존 데이터를 자연스러운 표현으로 업데이트
UPDATE content_metric_keys SET name = 'Technical Depth' WHERE name = 'technical_depth';
UPDATE content_metric_keys SET name = 'Tutorial Completeness' WHERE name = 'tutorial_completeness';
UPDATE content_metric_keys SET name = 'Beginner Friendliness' WHERE name = 'beginner_friendliness';
UPDATE content_metric_keys SET name = 'Practical Applicability' WHERE name = 'practical_applicability';
UPDATE content_metric_keys SET name = 'Information Density' WHERE name = 'information_density';
UPDATE content_metric_keys SET name = 'Entertainment Focus' WHERE name = 'entertainment_focus';
UPDATE content_metric_keys SET name = 'Gameplay Skill' WHERE name = 'gameplay_skill';
UPDATE content_metric_keys SET name = 'Commentary Quality' WHERE name = 'commentary_quality';
UPDATE content_metric_keys SET name = 'Viewer Interaction' WHERE name = 'viewer_interaction';
UPDATE content_metric_keys SET name = 'Conceptual Coverage' WHERE name = 'conceptual_coverage';
UPDATE content_metric_keys SET name = 'Example Richness' WHERE name = 'example_richness';
