export const VIDEO_ANALYSIS_PROMPT_TEMPLATE = `당신은 YouTube 영상 품질 분석 전문가입니다.

아래 자막과 댓글을 분석하여 영상과 커뮤니티의 품질을 정량적으로 평가하세요.

# 자막
{transcript}

# 댓글
{comments}

# 분석 요구사항

모든 점수는 0-100 사이의 정수여야 합니다.
모든 비율은 합계가 100이 되어야 합니다.

## 1. 콘텐츠 품질 (자막 기반, 0-100 점수)
- educational_value: 교육적 가치 (얼마나 배울 점이 있는가)
- entertainment_value: 엔터테인먼트 가치 (얼마나 재미있고 흥미로운가)
- information_accuracy: 정보 정확성 (사실 확인, 논리적 일관성)
- clarity: 전달력/명확성 (이해하기 쉬운 설명)
- depth: 깊이/전문성 (얼마나 깊이 있게 다루는가)
- overall_score: 종합 콘텐츠 품질 점수
- category: 콘텐츠 카테고리 (educational/entertainment/tutorial/vlog/review/news/gaming/music/other 중 하나)
- target_audience: 대상 청중 (general/professional/beginner/advanced/children 중 하나)

## 2. 여론 분석 (댓글 기반, 0-100 점수/비율)
- positive_ratio: 긍정적 댓글 비율 (0-100, 칭찬, 좋아요, 긍정적 반응)
- neutral_ratio: 중립적 댓글 비율 (0-100, 정보 요청, 질문, 중립적 의견)
- negative_ratio: 부정적 댓글 비율 (0-100, 비판, 불만, 부정적 반응)
- overall_score: 종합 여론 점수 (0: 매우 부정, 50: 중립, 100: 매우 긍정)
- intensity: 감정 표현 강도 (0: 담담함, 100: 매우 강렬함)

**중요: positive_ratio + neutral_ratio + negative_ratio = 정확히 100이어야 합니다!**

## 3. 커뮤니티 품질 (댓글 말투/태도, 0-100 점수)
- politeness: 예의 바른 말투 (존댓말, 정중한 표현 사용 정도)
- rudeness: 저급한 말투 (욕설, 비속어, 무례한 표현 사용 정도)
- kindness: 상냥한 말투 (따뜻함, 배려, 공감 표현 정도)
- toxicity: 독성/공격성 (혐오, 차별, 공격적 언행 정도)
- constructive: 건설적 의견 (유용한 피드백, 의미 있는 토론 정도)
- self_centered: 자기중심적 (자신의 이야기만, 관심받기 위한 댓글 정도)
- off_topic: 헛소리/주제이탈 (영상과 무관한 내용, 스팸성 댓글 정도)
- overall_score: 종합 커뮤니티 품질 점수 (0: 매우 저품질, 100: 매우 고품질)

## 4. 나이대 분석 (댓글 말투 기반 추정, 분포 %)
말투, 이모티콘 사용, 유행어, 표현 방식을 기반으로 추정:
- teens: 10대 비율 (0-100, ㅋㅋ, ㄹㅇ, 급식체, 최신 유행어)
- twenties: 20대 비율 (0-100, ㅇㅈ, ㄱㅇㄷ, 밈 사용, 트렌디한 표현)
- thirties: 30대 비율 (0-100, 정중한 존댓말, 균형잡힌 표현)
- forty_plus: 40대+ 비율 (0-100, 격식있는 표현, 정중한 어투)

**중요: teens + twenties + thirties + forty_plus = 정확히 100이어야 합니다!**

## 5. 종합 분석
- content_summary: 콘텐츠 요약 (100-300자, 자막 기반으로 영상 내용 요약)
- audience_reaction: 관객 반응 요약 (100-300자, 댓글 기반으로 시청자 반응 요약)
- key_insights: 주요 발견사항 배열 (최소 1개, 최대 5개, 각 항목은 간결한 한 문장)
- recommendations: 개선 제안 배열 (0-3개, 각 항목은 구체적이고 실행 가능한 제안)

**중요: 아래 JSON 구조를 정확히 따라 모든 필드를 반드시 포함하세요!**

{
  "content_quality": {
    "educational_value": 정수,
    "entertainment_value": 정수,
    "information_accuracy": 정수,
    "clarity": 정수,
    "depth": 정수,
    "overall_score": 정수,
    "category": "문자열",
    "target_audience": "문자열"
  },
  "sentiment": {
    "positive_ratio": 정수,
    "neutral_ratio": 정수,
    "negative_ratio": 정수,
    "overall_score": 정수,
    "intensity": 정수
  },
  "community": {
    "politeness": 정수,
    "rudeness": 정수,
    "kindness": 정수,
    "toxicity": 정수,
    "constructive": 정수,
    "self_centered": 정수,
    "off_topic": 정수,
    "overall_score": 정수
  },
  "age_groups": {
    "teens": 정수,
    "twenties": 정수,
    "thirties": 정수,
    "forty_plus": 정수
  },
  "summary": {
    "content_summary": "문자열",
    "audience_reaction": "문자열",
    "key_insights": ["문자열"],
    "recommendations": ["문자열"]
  }
}`;
