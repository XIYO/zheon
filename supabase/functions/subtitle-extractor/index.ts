import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsError, corsResponse, corsValidation } from "../_shared/cors.ts";
import { extractYouTubeSubtitles } from "../_shared/youtube-extractor.ts";

console.log("🎬 Subtitle Extractor Function Started");

Deno.serve(async (req) => {
  // CORS 검증
  const validation = corsValidation(req, ["POST"]);
  if (validation) return validation;

  try {
    // 요청 본문 파싱
    const { url } = await req.json();

    if (!url) {
      return corsError("URL is required", "MISSING_URL", 400);
    }

    console.log(`[Subtitle Extractor] Processing: ${url}`);

    // 기존 youtube-extractor 사용 (YouTubei.js 방식)
    const result = await extractYouTubeSubtitles(url);

    if (!result.success || !result.transcript) {
      return corsError(
        result.error || "Subtitle extraction failed",
        "EXTRACTION_ERROR",
        500,
      );
    }

    console.log(
      `[Subtitle Extractor] ✅ Success: ${result.transcript.length} characters`,
    );

    // 성공 응답
    return corsResponse({
      success: true,
      transcript: result.transcript,
      youtubeUrl: result.youtubeUrl,
    });
  } catch (error) {
    console.error("[Subtitle Extractor] ❌ Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    return corsError(errorMessage, "EXTRACTION_ERROR", 500);
  }
});
