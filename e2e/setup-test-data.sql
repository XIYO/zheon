-- 테스트용 커뮤니티 데이터 생성 (댓글 50개 미만 케이스)
INSERT INTO content_community_metrics (
  video_id,
  comments_analyzed,
  framework_version,
  updated_at
)
VALUES (
  'd1JlNifdnsw',
  25,
  'v1.0',
  NOW()
)
ON CONFLICT (video_id)
DO UPDATE SET
  comments_analyzed = 25,
  age_teens = NULL,
  age_20s = NULL,
  age_30s = NULL,
  age_40plus = NULL,
  age_median = NULL,
  age_adult_ratio = NULL,
  emotion_joy = NULL,
  emotion_trust = NULL,
  emotion_fear = NULL,
  emotion_surprise = NULL,
  emotion_sadness = NULL,
  emotion_disgust = NULL,
  emotion_anger = NULL,
  emotion_anticipation = NULL,
  emotion_dominant = NULL,
  emotion_entropy = NULL,
  valence_mean = NULL,
  arousal_mean = NULL,
  representative_comments = NULL,
  analysis_model = NULL,
  analyzed_at = NULL,
  updated_at = NOW();
