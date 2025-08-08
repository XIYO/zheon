/**
 * YouTube 영상 요약 생성 Runnable
 * 입력: { url: string, transcript: string, transcript_length: number, cached: boolean }
 * 출력: 입력 데이터 + { summary: string, summary_method: string }
 */

import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from 'npm:@langchain/google-genai@^0.1.0';
import { ChatPromptTemplate } from 'npm:@langchain/core@0.3.66/prompts';

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

			// Gemini 모델 설정
			const model = new ChatGoogleGenerativeAI({
				modelName: 'gemini-1.5-flash',
				apiKey: geminiApiKey,
				temperature: 0.3, // 낮은 temperature로 일관성 있는 정리
				maxOutputTokens: 2000 // 충분한 길이의 정리 허용
			});

			// 프롬프트 템플릿
			const summaryPrompt = ChatPromptTemplate.fromTemplate(`
당신은 YouTube 영상 콘텐츠를 분석하고 정리하는 전문가입니다.

다음 YouTube 영상 자막을 분석하여, 시청자가 영상을 보지 않고도 
핵심 내용을 완전히 이해할 수 있도록 정리해주세요.

자막:
{transcript}

다음 지침에 따라 정리해주세요:

1. 무의미한 내용 제거:
   - 인사말, 구독 요청, 좋아요 요청
   - 반복되는 내용, 말더듬, 침묵
   - 주제와 관련 없는 잡담

2. 핵심 내용 추출:
   - 영상의 주요 주제와 논점
   - 중요한 정보, 데이터, 팁
   - 실용적인 조언이나 인사이트
   - 구체적인 예시나 사례

3. 체계적인 구성:
   - 논리적인 흐름으로 재구성
   - 중요도에 따라 내용 배열
   - 관련 내용끼리 그룹화

응답 형식:

제목: [영상의 핵심 주제를 명확히 표현하는 제목]

핵심 정리:
[체계적으로 정리된 내용 - 최소 5문단 이상, 각 문단은 특정 주제나 포인트를 다룸]

주요 포인트:
• [핵심 포인트 1]
• [핵심 포인트 2]
• [핵심 포인트 3]
(필요한 만큼 추가)

실용적 정보:
[영상에서 언급된 구체적인 팁, 도구, 방법론 등]
      `);

			// 체인 생성 및 실행
			const chain = summaryPrompt.pipe(model);
			const response = await chain.invoke({ transcript: input.transcript });

			// 응답 파싱
			const content = response.content.toString();

			// 제목 추출
			const titleMatch = content.match(/제목:\s*(.+?)\n/);
			const title = titleMatch ? titleMatch[1].trim() : 'YouTube 영상 핵심 정리';

			// 전체 정리 내용 (제목 포함)
			const summary = content;

			console.log(`[Summary] ✅ Successfully generated summary with title: ${title}`);

			return {
				...input,
				title: title,
				summary: summary,
				summary_method: 'gemini-1.5-flash'
			};
		} catch (error) {
			console.error(`[Summary] ❌ Error generating summary:`, error);

			// Fallback 요약
			const fallbackSummary = `[자동 요약] 이 영상은 ${input.transcript.substring(0, 200)}... 에 대한 내용입니다.`;

			return {
				...input,
				title: 'YouTube 영상 요약',
				summary: fallbackSummary,
				summary_method: 'fallback'
			};
		}
	}
);
