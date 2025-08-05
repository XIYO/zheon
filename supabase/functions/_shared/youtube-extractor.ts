/**
 * YouTube Subtitle Extractor - Shared Utility
 *
 * Reusable function for extracting YouTube video subtitles/transcripts
 * using the extractor API (https://extractor.xiyo.dev/extract)
 */

export interface ExtractorResponse {
  transcript?: string;
  cached?: boolean;
  error?: string;
}

export interface YouTubeExtractionResult {
  success: boolean;
  transcript?: string;
  cached?: boolean;
  error?: string;
  youtubeUrl: string;
}

/**
 * Extract subtitles/transcript from a YouTube video URL
 * @param youtubeUrl - The YouTube video URL to extract subtitles from
 * @returns Promise<YouTubeExtractionResult> - The extraction result
 */
export async function extractYouTubeSubtitles(
  youtubeUrl: string,
): Promise<YouTubeExtractionResult> {
  try {
    // YouTube URL 형식 검증
    const youtubeRegex =
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return {
        success: false,
        error: "Invalid YouTube URL format",
        youtubeUrl,
      };
    }

    // Extractor API 호출 - 환경변수에서 URL 가져오기
    const extractorApiUrl = Deno.env.get("EXTRACT_API_URL");
    if (!extractorApiUrl) {
      return {
        success: false,
        error: "EXTRACT_API_URL environment variable not set",
        youtubeUrl,
      };
    }

    console.log(`Extracting subtitles from: ${youtubeUrl}`);
    console.log(`Using extractor API: ${extractorApiUrl}`);

    // Extractor API는 GET 메서드를 사용하고 쿼리 파라미터로 데이터 전달
    const extractorUrl = new URL(extractorApiUrl);
    extractorUrl.searchParams.set("url", youtubeUrl);
    extractorUrl.searchParams.set("transcript", "true");

    const extractorResponse = await fetch(extractorUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!extractorResponse.ok) {
      console.error(
        `Extractor API error: ${extractorResponse.status} ${extractorResponse.statusText}`,
      );

      return {
        success: false,
        error: `Failed to extract video data: ${extractorResponse.status}`,
        youtubeUrl,
      };
    }

    const extractorData: ExtractorResponse = await extractorResponse.json();
    console.log(`Extractor response:`, {
      hasTranscript: !!extractorData.transcript,
      transcriptLength: extractorData.transcript?.length || 0,
      cached: extractorData.cached,
    });

    // 자막이 없는 경우
    if (
      !extractorData.transcript || extractorData.transcript.trim().length === 0
    ) {
      return {
        success: false,
        error: "No transcript available for this video",
        youtubeUrl,
      };
    }

    const fullTranscript = extractorData.transcript.trim();
    console.log(`Transcript extracted: ${fullTranscript.length} characters`);

    return {
      success: true,
      transcript: fullTranscript,
      cached: extractorData.cached || false,
      youtubeUrl,
    };
  } catch (error) {
    console.error("YouTube subtitle extraction error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      youtubeUrl,
    };
  }
}
