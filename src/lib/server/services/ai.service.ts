import { generateObject, type LanguageModel } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { jsonSchema } from 'ai';
import * as v from 'valibot';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';

type AIProvider = 'gemini' | 'openai';

export interface CategoryInfo {
	slug: string;
	name: string;
	name_ko: string;
	description?: string;
	depth: number;
	path: string[];
}

export interface TagInfo {
	slug: string;
	name: string;
	name_ko: string;
}

export interface MetricKeyInfo {
	slug: string;
	name_ko: string;
	description: string;
	category_hint?: string;
}

export interface AIAnalysisInput {
	transcript: string;
	comments: string[];
	existingCategories: CategoryInfo[];
	existingTags: TagInfo[];
	existingMetricKeys: MetricKeyInfo[];
	latestNews?: Array<{
		title: string;
		content: string;
		url: string;
		publishedDate: string;
	}>;
	commentMetadata?: {
		totalCount: number;
		sampleMethod: string;
		timeRange: string;
		avgLikes?: number;
	};
}

export interface AIAnalysisOutput {
	summary: string;
	content_quality: {
		educational_value: number;
		entertainment_value: number;
		information_accuracy: number;
		clarity: number;
		depth: number;
		overall_score: number;
		category: string;
		target_audience: string;
	};
	sentiment: {
		positive_ratio: number;
		neutral_ratio: number;
		negative_ratio: number;
		overall_score: number;
		intensity: number;
	};
	community?: {
		politeness: number;
		rudeness: number;
		kindness: number;
		toxicity: number;
		constructive: number;
		self_centered: number;
		off_topic: number;
		overall_score: number;
	};
	age_groups?: {
		teens: number;
		twenties: number;
		thirties: number;
		forty_plus: number;
		median_age: number;
		adult_ratio: number;
	};
	plutchik_emotions?: {
		joy: number;
		trust: number;
		fear: number;
		surprise: number;
		sadness: number;
		disgust: number;
		anger: number;
		anticipation: number;
		dominant_emotion: string;
		entropy: number;
		valence_mean: number;
		arousal_mean: number;
	};
	insights: {
		content_summary: string;
		audience_reaction: string;
		key_insights: string[];
		recommendations: string[];
	};
	representative_comments?: {
		age_groups: {
			teens: string;
			twenties: string;
			thirties: string;
			forty_plus: string;
		};
		emotions: {
			joy: string;
			trust: string;
			fear: string;
			surprise: string;
			sadness: string;
			disgust: string;
			anger: string;
			anticipation: string;
		};
	};
	categories: Array<{
		slug: string;
		name: string;
		name_ko: string;
		description?: string;
		parent_slug?: string;
	}>;
	tags: Array<{
		slug: string;
		name: string;
		name_ko: string;
		description?: string;
		weight: number;
	}>;
	metric_keys: Array<{
		slug: string;
		name: string;
		name_ko: string;
		description: string;
	}>;
	metrics: Array<{
		key: string;
		score: number;
		reasoning: string;
	}>;
}

export interface AIServiceKeys {
	geminiApiKey?: string;
	openaiApiKey?: string;
}

export interface AIServiceModels {
	geminiModel?: string;
	openaiModel?: string;
}

export interface AIServiceOptions {
	maxRetries?: number;
}

export interface AIAnalysisResult {
	output: AIAnalysisOutput;
	usedModel: string;
	usedProvider: AIProvider;
}

export class AIService {
	private availableProviders: AIProvider[] = [];
	private geminiApiKey?: string;
	private openaiApiKey?: string;
	private geminiModel: string;
	private openaiModel: string;
	private defaultMaxRetries: number;

	constructor(keys: AIServiceKeys, models: AIServiceModels, options: AIServiceOptions = {}) {
		this.geminiApiKey = keys.geminiApiKey;
		this.openaiApiKey = keys.openaiApiKey;
		this.geminiModel = models.geminiModel!;
		this.openaiModel = models.openaiModel!;
		this.defaultMaxRetries = options.maxRetries ?? 2;

		if (this.geminiApiKey) {
			this.availableProviders.push('gemini');
		}
		if (this.openaiApiKey) {
			this.availableProviders.push('openai');
		}

		if (this.availableProviders.length === 0) {
			throw new Error('At least one AI API key is required (GEMINI_API_KEY or OPENAI_API_KEY)');
		}

		logger.info(`[AI] 사용 가능한 providers: ${this.availableProviders.join(', ')}`);
		logger.info(`[AI] Gemini 모델: ${this.geminiModel}, OpenAI 모델: ${this.openaiModel}`);
	}

	async analyzeVideo(input: AIAnalysisInput): Promise<AIAnalysisResult> {
		const maxRetries = this.defaultMaxRetries;
		const errors: Array<{ provider: AIProvider; error: unknown }> = [];

		for (const provider of this.availableProviders) {
			logger.info(`[AI] ${provider} provider로 분석 시도`);

			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					logger.info(`[AI] ${provider} 시도 ${attempt}/${maxRetries}`);
					const output = await this.performAnalysis(input, provider);
					const usedModel = provider === 'gemini' ? this.geminiModel : this.openaiModel;
					return { output, usedModel, usedProvider: provider };
				} catch (error) {
					logger.error(`[AI] ${provider} 시도 ${attempt}/${maxRetries} 실패:`, error);
					errors.push({ provider, error });

					if (attempt === maxRetries) {
						logger.warn(`[AI] ${provider} 모든 재시도 실패, 다음 provider로 이동`);
						break;
					}
					logger.info(`[AI] ${provider} ${attempt + 1}번째 시도 준비 중...`);
				}
			}
		}

		const errorMessages = errors
			.map(({ provider, error }) => `${provider}: ${error instanceof Error ? error.message : String(error)}`)
			.join('\n');
		throw new Error(`모든 AI providers 실패:\n${errorMessages}`);
	}

	private async performAnalysis(
		input: AIAnalysisInput,
		provider: AIProvider
	): Promise<AIAnalysisOutput> {
		const prompt = this.buildPrompt(input);
		const schema = this.getAnalysisSchema();
		const validationSchema = this.getValidationSchema();

		const model = this.createModel(provider);

		logger.info(`[AI] ${provider} 분석 시작`);

		const result = await generateObject({
			model,
			schema: jsonSchema(schema),
			schemaName: 'VideoAnalysis',
			schemaDescription:
				'Comprehensive video analysis with quality, sentiment, and community metrics',
			temperature: 0.1,
			maxRetries: 0,
			prompt
		});

		const rawAnalysis = result.object as Record<string, unknown>;
		const validationResult = v.safeParse(validationSchema, rawAnalysis);

		if (!validationResult.success) {
			const errors = validationResult.issues
				.map((issue) => {
					const pathStr =
						issue.path
							?.map((p) => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
							.join('.') || 'root';
					const currentValue =
						issue.input !== undefined ? `받은 값: ${JSON.stringify(issue.input)}` : '';
					return `${pathStr}: ${issue.message}${currentValue ? ` (${currentValue})` : ''}`;
				})
				.join('\n');
			logger.error(`[AI] ${provider} 검증 실패:`, errors);
			logger.error(`[AI] ${provider} 전체 응답:`, JSON.stringify(rawAnalysis, null, 2));
			throw new Error(`${provider} 응답 검증 실패:\n${errors}`);
		}

		logger.info(`[AI] ${provider} 검증 성공`);
		return validationResult.output as AIAnalysisOutput;
	}

	private createModel(provider: AIProvider): LanguageModel {
		switch (provider) {
			case 'gemini': {
				if (!this.geminiApiKey) {
					throw new Error('GEMINI_API_KEY is not available');
				}
				const google = createGoogleGenerativeAI({
					apiKey: this.geminiApiKey
				});
				return google(this.geminiModel);
			}
			case 'openai': {
				if (!this.openaiApiKey) {
					throw new Error('OPENAI_API_KEY is not available');
				}
				const openai = createOpenAI({
					apiKey: this.openaiApiKey
				});
				return openai(this.openaiModel);
			}
		}
	}

	private buildPrompt(input: AIAnalysisInput): string {
		const categoryList = input.existingCategories
			.map((c) => `${'  '.repeat(c.depth)}- ${c.slug} (${c.name_ko})`)
			.join('\n');
		const tagList = input.existingTags
			.map((t) => `- ${t.slug} (${t.name} / ${t.name_ko})`)
			.join('\n');
		const metricList = input.existingMetricKeys
			.map((m) => `- ${m.slug} (${m.name_ko}): ${m.description}`)
			.join('\n');
		const commentsText = input.comments.slice(0, 100).join('\n');
		const commentCount = input.comments.length;
		const skipCommunityAnalysis = commentCount < 50;

		const commentMetadataSection = input.commentMetadata
			? `
[댓글 메타데이터]
전체 댓글 수: ${input.commentMetadata.totalCount}개
제공 샘플: ${commentCount}개 (${input.commentMetadata.sampleMethod})
수집 기간: ${input.commentMetadata.timeRange}
${input.commentMetadata.avgLikes !== undefined ? `평균 좋아요: ${input.commentMetadata.avgLikes}개` : ''}
`
			: '';

		return `당신은 YouTube 영상 분석 전문가입니다. 자막과 댓글을 깊이 있게 분석하여 영상의 핵심 내용과 시청자 반응을 파악하세요.

**중요: 댓글 수 = ${commentCount}개${skipCommunityAnalysis ? ' (50개 미만이므로 커뮤니티 분석 생략)' : ''}**

**전역 규칙 (모든 응답에 적용):**

📋 R1. 언어: 모든 텍스트는 한국어 (summary, insights 등)

📊 R2. 숫자 형식:
  - 정수만 사용 (entropy 제외)
  - 음수 허용: overall_score, valence_mean, arousal_mean (-100~100)
  - 음수 금지: 나머지 모든 점수/비율/강도 (0 이상)

📏 R3. 길이 제한:
  - slug/name: ≤50자
  - name_ko: ≤50자
  - 댓글: ≤1000자
  - 인사이트/설명: ≤500자

🔤 R4. 명명 규칙:
  - slug: kebab-case (소문자+숫자+하이픈, 예: us-government-shutdown)
  - name: 일반 표기 (자유 형식, 예: US Government Shutdown)
  - name_ko: 일반 표기 (한국어, 예: 미국 정부 셧다운)
  - weight: 0.1~1.0 (카테고리/태그만 해당)

✓ R5. 일관성 검증:
  - sentiment.positive_ratio > 70 → plutchik의 joy/trust 높아야 함
  - content_quality.educational_value 높음 → metrics의 information-density 높아야 함

[자막 원문]
${input.transcript || '(자막 없음)'}
${commentMetadataSection}
[댓글 샘플]
${commentsText}

**중요: 자막이 없을 경우 댓글만으로 분석하세요.**
- 자막이 "(자막 없음)"이면 댓글의 내용, 반응, 패턴을 통해 영상 주제를 추론
- 댓글에서 자주 언급되는 키워드, 감정, 맥락을 종합하여 영상 내용을 파악
- summary는 가능한 데이터(자막 또는 댓글)를 최대한 활용하여 영상 내용을 요약

다음 항목들을 분석하세요:

1. summary (영상 요약, 500자 내외, 한국어로 작성):
   - **중요**: 영상 내용 자체만 서술, 분석 과정은 절대 언급 금지
   - 금지 표현: "자막은 제공되지 않았으나", "댓글 분석 결과", "시청자들은", "많은 이들이" 등
   - 영상이 보여주는 장면, 사건, 메시지를 직접적으로 서술
   - 주요 논점, 주장, 결론을 포함
   - 영상의 흐름과 구조를 반영
   - 단순 내용 나열이 아닌, 맥락과 의미를 담은 요약
   - **영어 자막이더라도 반드시 한국어로 요약 작성**

   올바른 예시:
   "이 영상은 노르웨이 바다에서 수십 마리의 범고래가 모여 있는 장관을 보여줍니다. 범고래들은..."

   잘못된 예시:
   "자막은 없으나 댓글 분석 결과, 시청자들은 범고래의 집단 행동에 경외감을 표현하고..."

2. content_quality (콘텐츠 품질 평가, 각 0-100):
   - educational_value: 교육적 가치, 학습 효과
   - entertainment_value: 재미, 흥미, 몰입도
   - information_accuracy: 정보의 정확성, 신뢰성
   - clarity: 설명의 명확성, 이해 용이성
   - depth: 내용의 깊이, 전문성
   - overall_score: 종합 품질 점수
   - category: 콘텐츠 카테고리 (예: 교육, 엔터테인먼트, 뉴스, 리뷰 등)
   - target_audience: 타겟 시청자층 (예: 학생, 직장인, 전문가 등)

3. sentiment (감정 분석, 댓글 기반):
   **필수 검증: positive_ratio + neutral_ratio + negative_ratio = 정확히 100**
   - positive_ratio: 긍정 비율 (0-100, 정수)
   - neutral_ratio: 중립 비율 (0-100, 정수)
   - negative_ratio: 부정 비율 (0-100, 정수)
   - overall_score: 전체 감정 점수 = (positive - negative), -100~100
   - intensity: 감정 강도 (0-100, 정수) - 감정 표현의 강렬함

   📘 예시:
   긍정 댓글 80개, 중립 15개, 부정 5개
   → {
     positive_ratio: 80,
     neutral_ratio: 15,
     negative_ratio: 5,
     overall_score: 75,  // 80 - 5 = 75
     intensity: 60       // 강하지만 극단적이진 않음
   }

${
	skipCommunityAnalysis
		? `**주의: 댓글 수가 50개 미만이므로 다음 항목들은 응답하지 마세요:**
   - community (커뮤니티 분위기)
   - age_groups (시청자 연령 추정)
   - plutchik_emotions (감정 분석)
   - representative_comments (대표 댓글)

   이 항목들은 JSON 응답에 포함하지 말고 생략하세요.`
		: `4. community (커뮤니티 분위기, 댓글 기반, 각 0-100):

   **측정 기준 (정량화):**
   - politeness: 존댓말/정중한 표현 사용 비율 (요/습니다/해요 등)
   - rudeness: 욕설/반말/공격적 표현 비율
   - kindness: 칭찬/격려/공감 표현 비율
   - toxicity: 혐오/비하/모욕 표현 비율
   - constructive: 건설적 피드백/제안 비율
   - self_centered: 자기 이야기만 하는 댓글 비율
   - off_topic: 영상 주제와 무관한 댓글 비율
   - overall_score: 전체 점수 = (politeness + kindness + constructive) - (rudeness + toxicity + self_centered + off_topic) * 2/7
     * 범위: -100 (매우 부정적) ~ +100 (매우 긍정적)

5. age_groups (시청자 연령 추정, 댓글 어투/내용 기반):
   **필수 검증: teens + twenties + thirties + forty_plus = 정확히 100**
   - teens: 10대 비율 (0-100, 정수)
   - twenties: 20대 비율 (0-100, 정수)
   - thirties: 30대 비율 (0-100, 정수)
   - forty_plus: 40대 이상 비율 (0-100, 정수)
   - 합이 100이 아니면 시스템 에러 발생
   - median_age: 중앙값 나이 (0-100, 정수)
   - adult_ratio: 성인 비율 (0-100, 정수, 20대 이상)

6. plutchik_emotions (Plutchik 8가지 기본 감정 + VAD, 댓글 기반):`
}
   **중요: 각 감정은 독립적인 강도로 평가 (합계 제약 없음)**

   **감정 강도 평가 방식:**
   - 각 감정을 0-100 스케일로 독립 평가
   - 여러 감정이 동시에 높을 수 있음 (예: joy=80, anticipation=70)
   - 댓글 전체에서 해당 감정이 얼마나 강하게 나타나는지 측정

   **장르별 기준선 (참고용, 절대적 아님):**
   - 교육: trust 60-70, anticipation 40-50, joy 30-40
   - 엔터테인먼트: joy 70-80, surprise 50-60, anticipation 50-60
   - 뉴스/시사: fear 40-50, anger 30-40, sadness 20-30
   - 게임/오락: joy 60-70, surprise 50-60, anticipation 60-70
   - 음악/예술: joy 70-80, trust 50-60, surprise 40-50

   **필수: 영상 컨텍스트 기반 감정 해석**
   - 반드시 위 [자막 원문]을 참고하여 영상의 주제, 장르, 분위기를 파악
   - 댓글의 감정을 영상 맥락에서 해석 (표면적 의미가 아닌 실제 의도 파악)
   - 예시 1: 게임/오락 영상에서 "죽었다", "망했다" → 흥미진진함, 몰입(joy, anticipation), 분노 아님
   - 예시 2: 스포츠 영상에서 "미쳤다", "죽인다" → 감탄, 놀람(surprise, joy), 부정적 감정 아님
   - 예시 3: 교육 영상에서 "힘들다", "어렵다" → 학습 도전(anticipation), 슬픔 아님
   - 예시 4: 음악/댄스 영상에서 "미친", "죽는다" → 감동, 열광(joy, surprise), 부정적 감정 아님
   - 슬랭, 은어, 과장 표현은 영상 장르와 문화적 맥락에서 해석
   - 긍정적 과장 표현(대박, 미쳤다, 죽인다 등)을 부정 감정으로 오해하지 말 것

   **감정 강도 (각각 독립적인 0-100 정수):**
   - joy: 기쁨 (0-100, 정수) - 긍정적이고 활발한 감정
   - trust: 신뢰 (0-100, 정수) - 긍정적이고 수용적인 감정
   - fear: 공포 (0-100, 정수) - 부정적이고 회피적인 감정
   - surprise: 놀람 (0-100, 정수) - 중립적이고 예상 밖의 감정
   - sadness: 슬픔 (0-100, 정수) - 부정적이고 무기력한 감정
   - disgust: 혐오 (0-100, 정수) - 부정적이고 거부적인 감정
   - anger: 분노 (0-100, 정수) - 부정적이고 공격적인 감정
   - anticipation: 기대 (0-100, 정수) - 긍정적이고 미래지향적인 감정

   **평가 가이드라인:**
   - 0-20: 거의 없음
   - 21-40: 약간 있음
   - 41-60: 보통
   - 61-80: 강함
   - 81-100: 매우 강함

   **기타 필드:**
   - dominant_emotion: 지배 감정 (8개 중 가장 높은 값, 예: "joy")
   - entropy: 감정 분포 엔트로피 (0-10, 소수점 허용)
   - valence_mean: 감정가 평균 (-100~100 스케일, 정수)
     * -100 = 매우 부정적, 0 = 중립, +100 = 매우 긍정적
     * 음수 허용, 전통적인 VAD 모델 스케일 사용
   - arousal_mean: 각성 평균 (-100~100 스케일, 정수)
     * -100 = 매우 차분함, 0 = 보통, +100 = 매우 흥분됨
     * 음수 허용, 전통적인 VAD 모델 스케일 사용

4. insights (심층 인사이트, 모두 한국어로 작성):
   - content_summary: 영상 콘텐츠 핵심 정리 (1000자 이내, 주요 논점과 결론, 한국어)
     * **중요**: 영상 내용만 직접 서술, "자막", "댓글", "시청자" 등 메타 정보 언급 금지
     * 영상이 전달하는 메시지, 보여주는 장면, 다루는 주제만 설명
   - audience_reaction: 시청자 반응 종합 (1000자 이내, 댓글 분석을 통한 수용도 파악, 한국어)
     * 이 필드에서만 시청자 반응을 분석하여 서술
   - key_insights: 핵심 인사이트 배열 (1-10개, 영상에서 발견한 중요한 통찰, 한국어)
   - recommendations: 개선 제안 배열 (0-10개, 크리에이터를 위한 구체적 조언, 한국어)

${
	!skipCommunityAnalysis
		? `7. representative_comments (대표 댓글 추출):
   **선택 규칙:**
   1. **광고/홍보 댓글 제외**: URL, 상품 홍보, 채널 홍보 금지
   2. **중복 사용 금지**: 같은 댓글을 여러 카테고리에 사용 금지
   3. **실제 사용자 반응**: 영상에 대한 순수한 의견/반응/질문만 선택
   4. **다양성 확보**: 최대한 다른 댓글 선택
   5. **원문 유지**: 댓글은 이모지 포함 원문 그대로 반환

   - age_groups: 각 연령대 대표 댓글 1개씩
     * teens, twenties, thirties, forty_plus

   - emotions: 각 감정 대표 댓글 1개씩
     * joy, trust, fear, surprise, sadness, disgust, anger, anticipation

   주의사항:
   - 댓글은 반드시 위 [댓글 상위 100개] 목록에서 선택
   - 적합한 댓글이 없으면 "-" 문자열만 반환

`
		: ''
}5. categories (최소 3개, depth 최소 2):
   1. 배열 순서: 부모 → 자식 (루트가 먼저)
   2. parent_slug: [기존 카테고리] 또는 같은 응답의 앞 항목 slug
   3. 필수 필드: slug, name, name_ko (description 선택)
   4. 명명: slug는 kebab-case (예: web-development), name은 자유 형식 (예: Web Development)

   올바른 예시:
   첫 번째: slug: "technology", name: "Technology", name_ko: "기술"
   두 번째: slug: "programming", name: "Programming", name_ko: "프로그래밍", parent_slug: "technology"
   세 번째: slug: "web-development", name: "Web Development", name_ko: "웹 개발", parent_slug: "programming"

   [기존 카테고리]
${categoryList || '(없음)'}

10. tags (최소 5개):
    1. 필수 필드: slug, name, name_ko, weight (description 선택)
    2. 명명: slug는 kebab-case (예: machine-learning), name은 자유 형식 (예: Machine Learning)
    3. weight: 영상 내 관련성 (0.1~1.0)
       - 1.0: 핵심 주제
       - 0.7-0.9: 주요 소재/기술
       - 0.4-0.6: 부차적 언급
       - 0.1-0.3: 간접적 연관

    참고 (기존 태그, 새로 만들어도 됨):
${tagList || '(없음)'}

11. metric_keys (정확히 3개):
    ⚠️ CRITICAL: slug는 kebab-case (R4), name은 자연스러운 영문 (공백/대문자 허용)

    **핵심 지표 3가지 선택 (균형: 강점 1개, 보통 1개, 약점 1개):**
    - engagement-level: 시청자 반응, 몰입도, 참여 수준
    - information-density: 정보 밀도, 교육적 가치, 학습 효과
    - entertainment-focus: 엔터테인먼트 가치, 재미 요소, 오락성

    **형식 규칙:**
    1. 필수 필드: slug, name, name_ko, description
    2. slug: kebab-case (예: "engagement-level")
    3. name: 자연어 (예: "Engagement Level")
    4. slug ↔ name 의미 일치

    참고 (기존 지표, 새로 만들어도 됨):
${metricList || '(없음)'}

12. metrics (정확히 3개):
    ⚠️ CRITICAL: key는 위 metric_keys의 slug와 정확히 일치 (kebab-case)

    **규칙:**
    1. key: metric_keys의 slug (예: "engagement-level")
    2. score: 0-100 정수 (강점 70-100, 보통 40-69, 약점 0-39)
    3. reasoning: 한국어, 자막/댓글 근거 제시 (≤500자)

    📘 예시:
    {
      key: "engagement-level",
      score: 85,
      reasoning: "댓글 100개 중 80개가 '재밌다', '웃겨' 등 긍정 반응. 답글도 활발하여 참여도 매우 높음."
    }

JSON 스키마에 맞춰 응답하세요.`;
	}

	private getAnalysisSchema() {
		// JSON Schema from summary.service.ts VideoAnalysisSchema
		return {
			type: 'object' as const,
			properties: {
				summary: { type: 'string' as const },
				content_quality: {
					type: 'object' as const,
					properties: {
						educational_value: { type: 'number' as const },
						entertainment_value: { type: 'number' as const },
						information_accuracy: { type: 'number' as const },
						clarity: { type: 'number' as const },
						depth: { type: 'number' as const },
						overall_score: { type: 'number' as const },
						category: { type: 'string' as const },
						target_audience: { type: 'string' as const }
					},
					required: [
						'educational_value',
						'entertainment_value',
						'information_accuracy',
						'clarity',
						'depth',
						'overall_score',
						'category',
						'target_audience'
					]
				},
				sentiment: {
					type: 'object' as const,
					properties: {
						positive_ratio: { type: 'number' as const },
						neutral_ratio: { type: 'number' as const },
						negative_ratio: { type: 'number' as const },
						overall_score: { type: 'number' as const },
						intensity: { type: 'number' as const }
					},
					required: [
						'positive_ratio',
						'neutral_ratio',
						'negative_ratio',
						'overall_score',
						'intensity'
					]
				},
				community: {
					type: 'object' as const,
					properties: {
						politeness: { type: 'number' as const },
						rudeness: { type: 'number' as const },
						kindness: { type: 'number' as const },
						toxicity: { type: 'number' as const },
						constructive: { type: 'number' as const },
						self_centered: { type: 'number' as const },
						off_topic: { type: 'number' as const },
						overall_score: { type: 'number' as const }
					},
					required: [
						'politeness',
						'rudeness',
						'kindness',
						'toxicity',
						'constructive',
						'self_centered',
						'off_topic',
						'overall_score'
					]
				},
				age_groups: {
					type: 'object' as const,
					properties: {
						teens: { type: 'number' as const },
						twenties: { type: 'number' as const },
						thirties: { type: 'number' as const },
						forty_plus: { type: 'number' as const },
						median_age: { type: 'number' as const },
						adult_ratio: { type: 'number' as const }
					},
					required: ['teens', 'twenties', 'thirties', 'forty_plus', 'median_age', 'adult_ratio']
				},
				plutchik_emotions: {
					type: 'object' as const,
					properties: {
						joy: { type: 'number' as const },
						trust: { type: 'number' as const },
						fear: { type: 'number' as const },
						surprise: { type: 'number' as const },
						sadness: { type: 'number' as const },
						disgust: { type: 'number' as const },
						anger: { type: 'number' as const },
						anticipation: { type: 'number' as const },
						dominant_emotion: { type: 'string' as const },
						entropy: { type: 'number' as const },
						valence_mean: { type: 'number' as const },
						arousal_mean: { type: 'number' as const }
					},
					required: [
						'joy',
						'trust',
						'fear',
						'surprise',
						'sadness',
						'disgust',
						'anger',
						'anticipation',
						'dominant_emotion',
						'entropy',
						'valence_mean',
						'arousal_mean'
					]
				},
				insights: {
					type: 'object' as const,
					properties: {
						content_summary: { type: 'string' as const },
						audience_reaction: { type: 'string' as const },
						key_insights: { type: 'array' as const, items: { type: 'string' as const } },
						recommendations: { type: 'array' as const, items: { type: 'string' as const } }
					},
					required: ['content_summary', 'audience_reaction', 'key_insights', 'recommendations']
				},
				representative_comments: {
					type: 'object' as const,
					properties: {
						age_groups: {
							type: 'object' as const,
							properties: {
								teens: { type: 'string' as const },
								twenties: { type: 'string' as const },
								thirties: { type: 'string' as const },
								forty_plus: { type: 'string' as const }
							},
							required: ['teens', 'twenties', 'thirties', 'forty_plus']
						},
						emotions: {
							type: 'object' as const,
							properties: {
								joy: { type: 'string' as const },
								trust: { type: 'string' as const },
								fear: { type: 'string' as const },
								surprise: { type: 'string' as const },
								sadness: { type: 'string' as const },
								disgust: { type: 'string' as const },
								anger: { type: 'string' as const },
								anticipation: { type: 'string' as const }
							},
							required: [
								'joy',
								'trust',
								'fear',
								'surprise',
								'sadness',
								'disgust',
								'anger',
								'anticipation'
							]
						}
					},
					required: ['age_groups', 'emotions']
				},
				categories: {
					type: 'array' as const,
					items: {
						type: 'object' as const,
						properties: {
							slug: { type: 'string' as const },
							name: { type: 'string' as const },
							name_ko: { type: 'string' as const },
							description: { type: 'string' as const },
							parent_slug: { type: 'string' as const }
						},
						required: ['slug', 'name', 'name_ko']
					}
				},
				tags: {
					type: 'array' as const,
					items: {
						type: 'object' as const,
						properties: {
							slug: { type: 'string' as const },
							name: { type: 'string' as const },
							name_ko: { type: 'string' as const },
							description: { type: 'string' as const },
							weight: { type: 'number' as const }
						},
						required: ['slug', 'name', 'name_ko', 'weight']
					}
				},
				metric_keys: {
					type: 'array' as const,
					items: {
						type: 'object' as const,
						properties: {
							slug: { type: 'string' as const },
							name: { type: 'string' as const },
							name_ko: { type: 'string' as const },
							description: { type: 'string' as const }
						},
						required: ['slug', 'name', 'name_ko', 'description']
					}
				},
				metrics: {
					type: 'array' as const,
					items: {
						type: 'object' as const,
						properties: {
							key: { type: 'string' as const },
							score: { type: 'number' as const },
							reasoning: { type: 'string' as const }
						},
						required: ['key', 'score', 'reasoning']
					}
				}
			},
			required: [
				'summary',
				'content_quality',
				'sentiment',
				'insights',
				'categories',
				'tags',
				'metric_keys',
				'metrics'
			]
		};
	}

	private getValidationSchema() {
		// Valibot validation schema from summary.service.ts
		return v.object({
			summary: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
			content_quality: v.object({
				educational_value: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				entertainment_value: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				information_accuracy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				clarity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				depth: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				category: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
				target_audience: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
			}),
			sentiment: v.pipe(
				v.object({
					positive_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					neutral_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					negative_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					overall_score: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer()),
					intensity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
				}),
				v.check(
					(obj) => obj.positive_ratio + obj.neutral_ratio + obj.negative_ratio === 100,
					'sentiment 비율의 합은 100이어야 합니다'
				)
			),
			community: v.optional(
				v.object({
					politeness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					rudeness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					kindness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					toxicity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					constructive: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					self_centered: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					off_topic: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					overall_score: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer())
				})
			),
			age_groups: v.optional(
				v.pipe(
					v.object({
						teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
						twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
						thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
						forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
						median_age: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
						adult_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
					}),
					v.check(
						(obj) => obj.teens + obj.twenties + obj.thirties + obj.forty_plus === 100,
						'age_groups 비율의 합은 100이어야 합니다'
					)
				)
			),
			plutchik_emotions: v.optional(
				v.object({
					joy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					trust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					fear: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					surprise: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					sadness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					disgust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					anger: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					anticipation: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
					dominant_emotion: v.pipe(
						v.string(),
						v.picklist([
							'joy',
							'trust',
							'fear',
							'surprise',
							'sadness',
							'disgust',
							'anger',
							'anticipation'
						])
					),
					entropy: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
					valence_mean: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer()),
					arousal_mean: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer())
				})
			),
			insights: v.object({
				content_summary: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
				audience_reaction: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
				key_insights: v.pipe(
					v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(500))),
					v.minLength(1),
					v.maxLength(10)
				),
				recommendations: v.pipe(
					v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(500))),
					v.minLength(0),
					v.maxLength(10)
				)
			}),
			representative_comments: v.optional(
				v.object({
					age_groups: v.object({
						teens: v.pipe(v.string(), v.maxLength(1000)),
						twenties: v.pipe(v.string(), v.maxLength(1000)),
						thirties: v.pipe(v.string(), v.maxLength(1000)),
						forty_plus: v.pipe(v.string(), v.maxLength(1000))
					}),
					emotions: v.object({
						joy: v.pipe(v.string(), v.maxLength(1000)),
						trust: v.pipe(v.string(), v.maxLength(1000)),
						fear: v.pipe(v.string(), v.maxLength(1000)),
						surprise: v.pipe(v.string(), v.maxLength(1000)),
						sadness: v.pipe(v.string(), v.maxLength(1000)),
						disgust: v.pipe(v.string(), v.maxLength(1000)),
						anger: v.pipe(v.string(), v.maxLength(1000)),
						anticipation: v.pipe(v.string(), v.maxLength(1000))
					})
				})
			),
			categories: v.pipe(
				v.array(
					v.object({
						slug: v.pipe(
							v.string(),
							v.minLength(1),
							v.maxLength(50),
							v.regex(
								/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
								'slug는 소문자, 숫자, 하이픈만 허용 (예: web-development)'
							)
						),
						name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
						name_ko: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
						description: v.optional(v.pipe(v.string(), v.maxLength(500))),
						parent_slug: v.optional(
							v.pipe(
								v.string(),
								v.minLength(1),
								v.maxLength(50),
								v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'parent_slug는 소문자, 숫자, 하이픈만 허용')
							)
						)
					})
				),
				v.minLength(3),
				v.maxLength(20)
			),
			tags: v.pipe(
				v.array(
					v.object({
						slug: v.pipe(
							v.string(),
							v.minLength(1),
							v.maxLength(50),
							v.regex(
								/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
								'slug는 소문자, 숫자, 하이픈만 허용 (예: machine-learning)'
							)
						),
						name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
						name_ko: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
						description: v.optional(v.pipe(v.string(), v.maxLength(500))),
						weight: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
					})
				),
				v.minLength(5),
				v.maxLength(15)
			),
			metric_keys: v.pipe(
				v.array(
					v.object({
						slug: v.pipe(
							v.string(),
							v.minLength(1),
							v.maxLength(50),
							v.regex(
								/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
								'slug는 kebab-case만 허용 (소문자+숫자+하이픈, 예: engagement-level, information-density)'
							)
						),
						name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
						name_ko: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
						description: v.pipe(v.string(), v.minLength(1), v.maxLength(500))
					})
				),
				v.length(3)
			),
			metrics: v.pipe(
				v.array(
					v.object({
						key: v.pipe(
							v.string(),
							v.minLength(1),
							v.maxLength(50),
							v.regex(
								/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
								'key는 kebab-case만 허용 (소문자+숫자+하이픈, 예: engagement-level)'
							)
						),
						score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
						reasoning: v.pipe(v.string(), v.minLength(1), v.maxLength(500))
					})
				),
				v.length(3)
			)
		});
	}

}
