import { assert, assertEquals } from "jsr:@std/assert@1";
import { createClient } from "jsr:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

/**
 * summary 테이블 데이터 정규화 테스트
 */
Deno.test("Data Normalization - Summary Table", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const supabase = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!
  );

  console.log("🚀 Starting summary table normalization process...");

  try {
    const { data, error } = await supabase.functions.invoke("normalize-existing-data", {
      body: { table: "summary" }
    });
    
    if (error) {
      console.error("❌ Function error:", error);
      
      // 에러 세부 정보 출력
      if (error.context) {
        const errorBody = await error.context.text();
        console.error("Error details:", errorBody);
      }
      
      throw new Error(`Function failed: ${error.message}`);
    }
    
    console.log("✅ Summary table normalization completed successfully!");
    console.log("📊 Results:", JSON.stringify(data, null, 2));
    
    // 기본 응답 검증
    assert(data, "Should return data");
    assertEquals(data.status, "success", "Status should be success");
    assert(data.stats, "Should return statistics");
    
    // 통계 검증
    const stats = data.stats;
    console.log("\n📈 Summary Table Normalization Statistics:");
    console.log(`📋 Original Total: ${stats.originalTotal}`);
    console.log(`🔄 URLs Normalized: ${stats.urlsNormalized}`);
    console.log(`✏️ Records Updated: ${stats.recordsUpdated}`);
    console.log(`🔍 Duplicates Found: ${stats.duplicatesFound}`);
    console.log(`🗑️ Duplicates Removed: ${stats.duplicatesRemoved}`);
    console.log(`❌ Errors Encountered: ${stats.errorsEncountered}`);
    console.log(`📊 Final Record Count: ${stats.finalRecordCount}`);
    console.log(`🎯 Unique Videos: ${stats.uniqueVideos}`);
    
    if (stats.errorUrls && stats.errorUrls.length > 0) {
      console.log(`\n⚠️ Error URLs:`);
      stats.errorUrls.forEach((url: string, index: number) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    }
    
    // 성공 기준
    assert(stats.originalTotal > 0, "Should have processed some records");
    assert(stats.errorsEncountered >= 0, "Error count should be non-negative");
    assert(stats.finalRecordCount > 0, "Should have some records remaining");
    assert(stats.uniqueVideos > 0, "Should have some unique videos");
    
    console.log("\n✨ Summary table data normalized successfully!");
    
  } catch (testError) {
    console.error("🚨 Test execution error:", testError);
    throw testError;
  }
});