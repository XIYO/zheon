/**
 * YouTube 자막 추출 Runnable
 * 입력: { youtube_url: string }
 * 출력: { youtube_url: string, transcript: string, transcript_length: number, cached: boolean }
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { extractYouTubeSubtitles } from "../youtube-extractor.ts";

export const extractSubtitles = RunnableLambda.from(
  async (input: { youtube_url: string }) => {
    console.log(`[Extract] Processing: ${input.youtube_url}`);
    
    const result = await extractYouTubeSubtitles(input.youtube_url);
    
    if (!result.success) {
      throw new Error(result.error || "Subtitle extraction failed");
    }
    
    // 다음 파이프라인으로 전달할 데이터
    return {
      youtube_url: input.youtube_url,
      transcript: result.transcript!,
      transcript_length: result.transcript?.length || 0,
      cached: result.cached || false
    };
  }
);