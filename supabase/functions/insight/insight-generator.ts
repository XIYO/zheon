/**
 * AI 기반 인사이트 생성
 * Vercel AI SDK + Gemini를 사용한 요약 및 인사이트 추출
 */

import { generateObject } from 'npm:ai';
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google';
import { valibotSchema } from 'npm:@ai-sdk/valibot';
import * as v from 'jsr:@valibot/valibot';

const InsightSchema = valibotSchema(
  v.object({
    title: v.pipe(v.string(), v.minLength(10), v.maxLength(100)),
    summary: v.pipe(v.string(), v.minLength(200), v.maxLength(1000)),
    insights: v.pipe(v.string(), v.minLength(500), v.maxLength(5000)),
  })
);

const PROMPT_TEMPLATE = `
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
- 유용한 온라인 강의나 문서
- 관련 커뮤니티나 포럼

작성 지침:
- 정확히 2000자 분량으로 작성 (±100자 허용)
- 영상 내용을 기반으로 하되, 학습에 도움되는 추가 정보 포함 가능
- 구체적인 자료명, 저자명 등 실존하는 자료만 언급
- 마크다운 형식으로 깔끔하게 구성
- 독자가 바로 활용할 수 있는 실용적인 정보 제공
`;

export async function generateInsight(
  transcript: string
): Promise<{ title: string; summary: string; insights: string }> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }

  console.log(`[Insight Generator] Processing transcript: ${transcript.length} characters`);

  const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
  const model = google('gemini-2.5-flash-lite-preview-09-2025');
  const prompt = PROMPT_TEMPLATE.replace('{transcript}', transcript);

  console.log(`[Insight Generator] Calling Gemini API...`);

  const result = await generateObject({
    model,
    schema: InsightSchema,
    temperature: 0.3,
    prompt,
  });

  const generated = result.object as {
    title: string;
    summary: string;
    insights: string;
  };

  console.log(`[Insight Generator] ✅ Success: Generated title "${generated.title}"`);

  return {
    title: generated.title,
    summary: generated.summary,
    insights: generated.insights,
  };
}
