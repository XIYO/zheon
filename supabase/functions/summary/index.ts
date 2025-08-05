import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { extractYouTubeSubtitles } from "../_shared/youtube-extractor.ts";
import { corsValidation, corsResponse, corsError } from "../_shared/cors.ts";

console.log("Summary function started");

Deno.serve(async (req) => {
  const validation = corsValidation(req, ["POST"]);
  if (validation) return validation;
  
  try {
    // 요청 본문 파싱
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return corsError("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    const { youtubeUrl } = requestBody;

    // YouTube URL 검증
    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      return corsError("YouTube URL is required", "MISSING_URL", 400);
    }

    console.log(`Processing YouTube URL: ${youtubeUrl}`);

    // 공유 함수를 사용해서 자막 추출
    const extractionResult = await extractYouTubeSubtitles(youtubeUrl);

    if (!extractionResult.success) {
      const errorCode = extractionResult.error?.includes("Invalid YouTube URL")
        ? "INVALID_URL_FORMAT"
        : extractionResult.error?.includes("No transcript")
        ? "NO_TRANSCRIPT"
        : extractionResult.error?.includes("EXTRACT_API_URL")
        ? "MISSING_API_CONFIG"
        : extractionResult.error?.includes("Failed to extract")
        ? "EXTRACTOR_API_ERROR"
        : "EXTRACTION_ERROR";

      return corsError(
        extractionResult.error || "Unknown extraction error",
        errorCode,
        errorCode === "MISSING_API_CONFIG" ||
          errorCode === "EXTRACTOR_API_ERROR"
          ? 500
          : 400,
      );
    }

    // 성공 응답
    return corsResponse({
      status: "success",
      message: "Transcript extracted successfully",
      youtubeUrl: extractionResult.youtubeUrl,
      transcript: {
        text: extractionResult.transcript!,
        characters: extractionResult.transcript!.length,
        cached: extractionResult.cached || false,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Summary function error:", error);
    return corsError("Internal server error", "INTERNAL_ERROR", 500);
  }
});
