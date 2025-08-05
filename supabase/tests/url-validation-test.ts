import { assert, assertEquals } from "jsr:@std/assert@1";
import { createClient } from "jsr:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

/**
 * 다양한 YouTube URL 형식 테스트
 */
Deno.test("Summary Function - Various YouTube URL Formats", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const supabase = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!
  );

  console.log("🧪 Testing various YouTube URL formats...");

  // 테스트할 다양한 YouTube URL 형식들
  const validUrls = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  // 표준 형식
    "https://youtu.be/dQw4w9WgXcQ",                 // 단축 URL
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",    // 모바일 URL
    "https://youtube.com/watch?v=dQw4w9WgXcQ",      // www 없이
    "https://www.youtube.com/embed/dQw4w9WgXcQ",    // 임베드 URL
    "https://www.youtube.com/v/dQw4w9WgXcQ",        // 이전 임베드 형식
  ];

  for (const testUrl of validUrls) {
    console.log(`\n🔗 Testing: ${testUrl}`);
    
    const { data, error } = await supabase.functions.invoke("summary", {
      body: { url: testUrl }
    });

    // 성공하거나 중복 에러가 발생해야 함 (이미 저장된 URL일 수 있음)
    if (error) {
      // 409 Conflict (중복)는 정상
      if (error.context?.status === 409) {
        console.log("  ✅ Duplicate URL (expected)");
      } else {
        throw new Error(`Unexpected error for ${testUrl}: ${error.message}`);
      }
    } else {
      assert(data?.status === "success", `Should process ${testUrl} successfully`);
      console.log("  ✅ Processed successfully");
    }
  }

  console.log("\n✨ All YouTube URL formats handled correctly!");
});