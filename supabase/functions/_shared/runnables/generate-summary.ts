/**
 * YouTube 영상 요약 생성 Runnable
 * 입력: { url: string, transcript: string, transcript_length: number, cached: boolean }
 * 출력: 입력 데이터 + { summary: string, summary_method: string }
 */

import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from 'npm:@langchain/google-genai@^0.1.0';
import { ChatPromptTemplate } from 'npm:@langchain/core@0.3.66/prompts';
import { z } from 'npm:zod@3.23.8';

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
				summary: z.string().describe('영상의 핵심을 1-2문장으로 압축한 한글 초간단 요약'),
				insights: z.string().describe('영상 내용을 분석한 전문 보고서 수준의 상세한 한글 분석 문서')
			});

			// Gemini 모델 설정 - 구조화된 출력 사용
			const model = new ChatGoogleGenerativeAI({
				modelName: 'gemini-1.5-flash', // 무료 티어에서 사용 가능한 모델
				apiKey: geminiApiKey,
				temperature: 0.4, // 약간 높여서 창의적 분석 허용
				maxOutputTokens: 8192 // Flash 모델의 최대 출력 토큰
			}).withStructuredOutput(outputSchema);

			// 프롬프트 템플릿
			const summaryPrompt = ChatPromptTemplate.fromTemplate(`
당신은 YouTube 영상 콘텐츠를 분석하고 전문 보고서를 작성하는 수석 분석가입니다.
모든 응답은 반드시 한글로 작성하세요.

다음 YouTube 영상 자막을 심층 분석하여 보고서를 작성해주세요.

자막:
{transcript}

제거해야 할 불필요한 요소들:
- 인사말, 구독/좋아요 요청, 종료 멘트
- 광고, 스폰서 언급, 프로모션
- 말더듬, 반복, 침묵, "어...", "음..." 같은 추임새
- 주제와 무관한 잡담이나 농담

작성 지침:

1. title (한글 제목):
   - 영상의 핵심 주제를 명확히 표현하는 전문적인 한글 제목

2. summary (한글 초간단 요약):
   - 1-2문장으로 극도로 압축
   - "이 영상은 [주제]를 다루며, [핵심 내용]을 설명한다" 형식
   - 반드시 한글로 작성

3. insights (전문 분석 보고서):
   보고서 수준의 심층 분석을 작성하세요. 다음 구조를 포함해야 합니다:
   
   ## 1. 개요
   - 영상의 주제와 목적
   - 핵심 메시지와 논지
   
   ## 2. 상세 내용 분석
   - 영상에서 다룬 모든 주요 포인트를 체계적으로 정리
   - 각 포인트별 상세한 설명과 근거
   - 제시된 데이터, 통계, 사례 분석
   
   ## 3. 핵심 인사이트
   - 영상의 핵심 통찰과 교훈
   - 실무 적용 가능한 구체적 방법론
   - 도구, 기술, 프레임워크 상세 설명
   
   ## 4. 비판적 분석
   - 영상에서 다루지 못한 중요한 측면
   - 보완이 필요한 부분
   - 추가로 고려해야 할 관점
   
   ## 5. 확장된 시사점
   - 업계 트렌드와의 연관성
   - 미래 전망과 발전 방향
   - 관련 분야에 미치는 영향
   
   ## 6. 실행 가능한 제언
   - 구체적인 실행 계획
   - 단계별 적용 방법
   - 예상되는 효과와 주의사항
   
   ## 7. 결론
   - 핵심 요약과 최종 평가
   - 후속 학습 추천 사항

   보고서는 전문적이고 학술적인 톤을 유지하며, 영상 내용을 넘어서는 
   부가가치 있는 분석을 제공해야 합니다. 최소 3000자 이상으로 작성하세요.
      `);

			// 체인 생성 및 실행
			const chain = summaryPrompt.pipe(model);
			const response = await chain.invoke({ transcript: input.transcript });

			// withStructuredOutput 사용시 응답이 이미 구조화된 객체로 반환됨
			const { title, summary, insights } = response;
			
			// 필수 필드 검증
			if (!title || !summary) {
				throw new Error(`Missing required fields in AI response. Title: ${!!title}, Summary: ${!!summary}`);
			}

			console.log(`[Summary] ✅ Successfully generated summary with title: ${title}`);

			return {
				...input,
				title: title,
				summary: summary,
				insights: insights || '',
				summary_method: 'gemini-1.5-flash-structured'
			};
		} catch (error) {
			console.error(`[Summary] ❌ Error generating summary:`, error);
			throw error; // 에러를 그대로 전파
		}
	}
);
