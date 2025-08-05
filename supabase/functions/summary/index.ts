import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsValidation, corsResponse, corsError } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { validateUrl } from "../_shared/runnables/validate-url.ts";
import { checkDuplicate } from "../_shared/runnables/check-duplicate.ts";
import { extractSubtitles } from "../_shared/runnables/extract-subtitles.ts";
import { generateSummary } from "../_shared/runnables/generate-summary.ts";
import { saveToDB } from "../_shared/runnables/save-to-db.ts";

console.log("🦜 Summary Pipeline Started");

Deno.serve(async (req) => {
  const validation = corsValidation(req, ["POST"]);
  if (validation) return validation;
  
  try {
    let url: string | undefined;
    
    // Content-Type에 따라 다르게 처리
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // FormData로 전송된 경우
      const formData = await req.formData();
      url = formData.get("url") as string;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // URL encoded form으로 전송된 경우
      const text = await req.text();
      const params = new URLSearchParams(text);
      url = params.get("url") || undefined;
    } else {
      // JSON으로 전송된 경우 (기존 방식)
      const body = await req.json().catch(() => ({}));
      url = body.url;
    }
    
    if (!url) {
      return corsError("URL is required", "MISSING_URL", 400);
    }

    console.log(`🚀 Processing: ${url}`);

    // 파이프라인: URL검증 → 중복체크 → 추출 → 요약 → 저장
    const pipeline = validateUrl
      .pipe(checkDuplicate)
      .pipe(extractSubtitles)
      .pipe(generateSummary)
      .pipe(saveToDB);

    // 실행 (공개 캐시 시스템)
    const result = await pipeline.invoke({ url });
    
    console.log("🎯 Pipeline result:", result);

    // 간단한 성공 응답
    return corsResponse({
      status: "success",
      message: result?.was_duplicate 
        ? "Using cached summary" 
        : "Video processed successfully",
      debug: {
        record_id: result?.record_id,
        saved_at: result?.saved_at,
        was_duplicate: result?.was_duplicate || false
      }
    });

  } catch (error) {
    console.error("❌ Pipeline error:", error);
    
    // 지원하지 않는 URL 에러인 경우 400 Bad Request 반환
    if (error instanceof Error && error.message.includes("Unsupported URL")) {
      return corsError(
        error.message,
        "UNSUPPORTED_URL", 
        400
      );
    }
    
    // Invalid URL 에러인 경우 400 Bad Request 반환
    if (error instanceof Error && (error.message.includes("Invalid URL") || error.message.includes("Could not extract"))) {
      return corsError(
        error.message,
        "INVALID_URL", 
        400
      );
    }
    
    // 중복 URL 에러인 경우 409 Conflict 반환
    if (error instanceof Error && error.message.includes("already exists")) {
      return corsError(
        error.message,
        "DUPLICATE_URL", 
        409
      );
    }
    
    return corsError(
      error instanceof Error ? error.message : "Pipeline failed", 
      "PIPELINE_ERROR", 
      500
    );
  }
});