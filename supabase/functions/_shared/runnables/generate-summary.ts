/**
 * YouTube 영상 요약 생성 Runnable
 * 입력: { url: string, transcript: string, transcript_length: number, cached: boolean }
 * 출력: 입력 데이터 + { summary: string, summary_method: string }
 */

import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from 'npm:@langchain/google-genai@^0.1.0';
import { ChatPromptTemplate } from 'npm:@langchain/core@0.3.66/prompts';
import { z } from 'npm:zod@3.23.8';
import { HarmBlockThreshold, HarmCategory } from 'npm:@google/generative-ai';

export const generateSummary = RunnableLambda.from(
	async (input: {
		url: string;
		transcript: string;
		transcript_length: number;
		cached: boolean;
		_skip_save?: boolean;
		_existing_record?: any;
	}) => {
		// 중복 체크에서 스킵 플래그가 설정된 경우
		if (input._skip_save) {
			console.log(`[Summary] ⏭️ Skipping generation - using existing record`);
			// 기존 레코드 정보를 그대로 전달
			return {
				...input,
				summary: 'CACHED',
				summary_method: 'cached'
			};
		}

		console.log(`[Summary] Generating for ${input.transcript_length} chars...`);

		try {
			// Gemini API 키 확인
			const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
			if (!geminiApiKey) {
				throw new Error('GEMINI_API_KEY is not set');
			}

			// 출력 스키마 정의
			const outputSchema = z.object({
				title: z.string().describe('영상의 핵심 주제를 명확히 표현하는 한글 제목'),
				summary: z
					.string()
					.describe('영상의 핵심 내용을 체계적으로 정리한 500자 분량의 한글 요약'),
				insights: z
					.string()
					.describe(
						'영상에서 다룬 핵심 개념, 참고 문헌, 사전 지식이 필요한 개념들을 포함한 2000자 분량의 한글 심화 분석'
					)
			});

			// Gemini 모델 설정 - 구조화된 출력 사용
			const model = new ChatGoogleGenerativeAI({
				modelName: 'gemini-2.5-flash-lite-preview-09-2025', // 무료 티어에서 사용 가능한 최신 모델
				apiKey: geminiApiKey,
				temperature: 0.3, // 정확성과 일관성을 위해 낮은 온도 사용
				maxOutputTokens: 8192, // Flash 모델의 최대 출력 토큰
				// Safety settings - 콘텐츠 필터 완전 해제 (Gemini 지원 4개 카테고리)
				safetySettings: [
					{
						category: HarmCategory.HARM_CATEGORY_HARASSMENT,
						threshold: HarmBlockThreshold.BLOCK_NONE
					},
					{
						category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
						threshold: HarmBlockThreshold.BLOCK_NONE
					},
					{
						category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
						threshold: HarmBlockThreshold.BLOCK_NONE
					},
					{
						category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
						threshold: HarmBlockThreshold.BLOCK_NONE
					}
				]
			}).withStructuredOutput(outputSchema);

			// 프롬프트 템플릿
			const summaryPrompt = ChatPromptTemplate.fromTemplate(`
당신은 YouTube 영상 자막을 분석하여 핵심 내용을 추출하고, 독자에게 학습 가치를 제공하는 전문 요약가입니다.

===== 분석할 영상 자막 =====
{transcript}
===========================

아래 세 가지 항목을 작성해주세요:

【1. title - 제목】
영상의 핵심 주제를 정확하게 표현하는 전문적이고 명확한 한글 제목을 작성하세요.

【2. summary - 500자 요약】
영상의 핵심 내용을 500자 분량으로 체계적으로 정리하세요:
- 영상이 다루는 주제와 목적
- 핵심 아이디어와 주요 논점 (우선순위 순으로)
- 실용적인 결론 또는 시사점

작성 지침:
- 정확히 500자 분량으로 작성 (±50자 허용)
- 영상에서 실제로 언급된 내용만 포함
- 간결하고 명료한 문장 사용
- 독자가 영상의 전체 맥락을 파악할 수 있도록 구성

【3. insights - 2000자 핵심 인사이트】
영상 내용을 바탕으로 독자의 이해를 돕는 2000자 분량의 심화 분석을 작성하세요.

다음 섹션을 포함해야 합니다:

## 핵심 개념 설명
영상에서 다룬 중요한 개념들을 상세히 설명합니다:
- 각 개념의 정의와 의미
- 개념 간의 관계와 맥락
- 실무에서의 적용 방법

## 사전 지식 및 배경 개념
영상을 완전히 이해하기 위해 알아두면 좋은 사전 지식:
- 영상에서 전제하는 기본 개념들
- 관련 분야의 기초 이론
- 이해를 돕는 비유나 예시

## 추천 학습 자료
더 깊이 학습하고 싶은 독자를 위한 참고 자료:
- 관련 논문이나 학술 자료 (저자, 제목 포함)
- 추천 도서 (저자, 제목 포함)
- 유용한 온라인 강의나 문서 링크
- 관련 커뮤니티나 포럼

작성 지침:
- 정확히 2000자 분량으로 작성 (±100자 허용)
- 영상 내용을 기반으로 하되, 학습에 도움되는 추가 정보 포함 가능
- 구체적인 자료명, 저자명 등 실존하는 자료만 언급
- 마크다운 형식으로 깔끔하게 구성
- 독자가 바로 활용할 수 있는 실용적인 정보 제공
      `);

			// 체인 생성 및 실행
			const chain = summaryPrompt.pipe(model);
			const response = await chain.invoke({ transcript: input.transcript });

			// withStructuredOutput 사용시 응답이 이미 구조화된 객체로 반환됨
			const { title, summary, insights } = response;

			// 필수 필드 검증
			if (!title || !summary) {
				throw new Error(
					`Missing required fields in AI response. Title: ${!!title}, Summary: ${!!summary}`
				);
			}

			console.log(`[Summary] ✅ Successfully generated summary with title: ${title}`);

			return {
				...input,
				title: title,
				summary: summary,
				insights: insights || '',
				summary_method: 'gemini-2.5-flash-lite-structured'
			};
		} catch (error) {
			console.error(`[Summary] ❌ Error generating summary:`, error);
			throw error; // 에러를 그대로 전파
		}
	}
);
