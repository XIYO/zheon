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
				modelName: 'gemini-2.5-flash-lite-preview-09-2025', // 무료 티어에서 사용 가능한 최신 모델
				apiKey: geminiApiKey,
				temperature: 0.4, // 약간 높여서 창의적 분석 허용
				maxOutputTokens: 8192 // Flash 모델의 최대 출력 토큰
			}).withStructuredOutput(outputSchema);

			// 프롬프트 템플릿
			const summaryPrompt = ChatPromptTemplate.fromTemplate(`
당신은 YouTube 영상을 분석하여 독자에게 영상보다 더 큰 가치를 제공하는 지식 큐레이터입니다. 단순히 영상 내용을 정리하는 것이 아니라, 해당 주제에 대한 포괄적이고 심도 있는 지식 문서를 작성하는 것이 목표입니다.

===== 분석할 영상 자막 =====
{transcript}
===========================

당신의 임무:
제공된 영상 자막을 출발점으로 삼되, 그것을 훨씬 넘어서는 풍부하고 가치 있는 문서를 만들어주세요. 영상이 다루는 주제에 대해 독자가 알아야 할 모든 것을 담은, 완성도 높은 지식 자료를 작성하는 것이 목표입니다.

세 가지 결과물을 작성해주세요:

【1. title - 제목】
영상의 핵심 주제를 정확하게 표현하는 전문적이고 매력적인 한글 제목

【2. summary - 한 줄 요약】
"이 영상은 [주제]를 다루며, [핵심 내용]을 설명합니다" 형식의 1-2문장 요약

【3. insights - 확장된 지식 문서】

이 섹션은 영상을 뛰어넘는 가치를 제공해야 합니다. 다음과 같이 작성하세요:

## 서론: 왜 이 주제가 중요한가

이 주제가 현재 왜 중요한지, 어떤 배경과 맥락 속에서 등장했는지를 상세히 설명하세요. 업계의 현황, 기술 발전의 흐름, 사회적 필요성 등을 종합적으로 다루어 독자가 큰 그림을 이해할 수 있도록 합니다. 영상에서 언급하지 않은 역사적 배경이나 현재의 트렌드도 포함시켜 주제에 대한 완전한 이해를 돕습니다.

## 핵심 개념과 원리의 상세 설명

영상에서 다룬 핵심 내용을 단순히 반복하지 말고, 각 개념을 깊이 있게 확장하여 설명하세요. 관련된 이론적 배경, 작동 원리, 실제 사례 등을 추가하여 독자가 완벽하게 이해할 수 있도록 합니다. 영상에서 간단히 언급하고 넘어간 부분도 찾아서 상세히 보충 설명하세요.

## 실제 적용 사례와 구체적 방법론

이론을 넘어 실제로 어떻게 적용할 수 있는지 구체적인 예시와 함께 설명합니다. 단계별 가이드, 실제 프로젝트 사례, 성공과 실패 사례를 모두 다루어 독자가 실무에 바로 적용할 수 있는 인사이트를 제공하세요. 영상에서 다루지 않은 추가적인 방법론이나 대안적 접근법도 소개합니다.

## 관련 기술과 도구의 종합적 소개

주제와 관련된 모든 기술, 도구, 플랫폼, 프레임워크를 종합적으로 소개합니다. 각각의 장단점, 사용 시나리오, 선택 기준 등을 상세히 비교 분석하여 독자가 자신의 상황에 맞는 최적의 선택을 할 수 있도록 돕습니다. 최신 버전 정보와 향후 로드맵도 포함시키세요.

## 심화 학습을 위한 추가 주제들

영상에서 다루지 않았지만 알아두면 좋은 관련 주제들을 소개합니다. 고급 기법, 최적화 방법, 보안 고려사항, 성능 튜닝, 확장성 설계 등 전문가 수준의 내용도 포함시켜 독자가 더 깊이 학습할 수 있는 방향을 제시합니다.

## 업계 동향과 미래 전망

현재 이 분야가 어떻게 발전하고 있는지, 주요 기업들은 어떤 방향으로 움직이고 있는지, 앞으로 어떤 변화가 예상되는지를 분석합니다. 최신 연구 동향, 새로운 표준, 혁신적인 접근법 등을 소개하여 독자가 미래를 준비할 수 있도록 합니다.

## 자주 발생하는 문제와 해결 방법

실제로 이 주제를 다룰 때 자주 마주치는 문제들과 그 해결책을 정리합니다. 일반적인 실수, 함정, 오해 등을 미리 알려주어 독자가 시행착오를 줄일 수 있도록 돕습니다. 트러블슈팅 가이드와 베스트 프랙티스도 포함시키세요.

## 실무자를 위한 체크리스트와 로드맵

독자가 바로 행동에 옮길 수 있도록 구체적인 체크리스트, 학습 로드맵, 프로젝트 템플릿 등을 제공합니다. 초급자부터 고급자까지 각 수준별로 무엇을 해야 하는지 명확하게 가이드합니다.

## 추천 자료와 커뮤니티

더 깊이 학습하고 싶은 독자를 위해 추천 도서, 온라인 강의, 공식 문서, 블로그, 유튜브 채널, 커뮤니티, 컨퍼런스 등을 종합적으로 소개합니다. 각 자료의 특징과 장점을 설명하여 독자가 자신에게 맞는 자료를 선택할 수 있도록 합니다.

## 맺음말: 핵심 메시지와 행동 지침

전체 내용을 종합하여 가장 중요한 메시지를 다시 한 번 강조하고, 독자가 지금 당장 시작할 수 있는 구체적인 첫 걸음을 제시합니다. 장기적인 성장 방향과 함께 동기부여가 되는 메시지로 마무리합니다.

---

작성 지침:
- 최소 5000자 이상의 풍부한 내용으로 작성
- 영상 내용은 기초 자료로만 활용하고, 그것을 훨씬 넘어서는 가치 제공
- 독자가 이 문서만 읽어도 해당 주제의 전문가 수준 지식을 얻을 수 있도록 작성
- 실용적이면서도 이론적 깊이를 갖춘 균형잡힌 문서
- 자연스럽고 읽기 쉬운 문체를 유지하되, 전문성은 타협하지 않음
- 구체적인 예시, 수치, 사례를 최대한 많이 포함
- 각 섹션은 충분히 상세하게 작성하여 독자가 완전히 이해할 수 있도록 함
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
