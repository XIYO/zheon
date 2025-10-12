/**
 * YouTube 영상 요약 생성 Runnable
 * 입력: { url: string, transcript: string, transcript_length: number, cached: boolean }
 * 출력: 입력 데이터 + { summary: string, summary_method: string }
 *
 * Vercel AI SDK 방식 - insight-generator Edge Function 호출
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";

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
        summary: "CACHED",
        summary_method: "cached",
      };
    }

    console.log(`[Summary] Generating for ${input.transcript_length} chars...`);
    console.log(`[Summary] Calling insight-generator Edge Function...`);

    try {
      // insight-generator Edge Function 호출
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/insight-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ transcript: input.transcript }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`insight-generator failed: ${error}`);
      }

      const result = await response.json();

      if (!result.success || !result.title || !result.summary) {
        throw new Error(
          `Missing required fields in insight-generator response: ${JSON.stringify(result)}`
        );
      }

      console.log(
        `[Summary] ✅ Successfully generated summary with title: ${result.title}`
      );

      return {
        ...input,
        title: result.title,
        summary: result.summary,
        insights: result.insights || "",
        summary_method: "vercel-ai-sdk-edge-function",
      };
    } catch (error) {
      console.error(`[Summary] ❌ Error generating summary:`, error);
      throw error; // 에러를 그대로 전파
    }
  },
);
