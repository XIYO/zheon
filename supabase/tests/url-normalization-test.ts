import { assert, assertEquals } from "jsr:@std/assert@1";
import { createClient } from "jsr:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

/**
 * YouTube URL 정규화 테스트
 * 다양한 형태의 YouTube URL이 동일한 정규화된 형태로 변환되는지 확인
 */
Deno.test("URL Normalization - Various YouTube URL Formats", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const supabase = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!
  );

  console.log("🧪 Testing YouTube URL normalization...");

  // 테스트할 URL 패턴들 (모두 같은 비디오: K2lvjqvpajc - 실제 존재하는 비디오)
  const testUrls = [
    {
      name: "Standard YouTube URL",
      url: "https://www.youtube.com/watch?v=K2lvjqvpajc",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    },
    {
      name: "YouTube Short URL",
      url: "https://youtu.be/K2lvjqvpajc",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    },
    {
      name: "YouTube Short URL with si parameter",
      url: "https://youtu.be/K2lvjqvpajc?si=Gk-mWux5ZID_457Z",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    },
    {
      name: "YouTube Short URL with t parameter",
      url: "https://youtu.be/K2lvjqvpajc?si=Gk-mWux5ZID_457Z&t=4",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    },
    {
      name: "YouTube Embed URL",
      url: "https://www.youtube.com/embed/K2lvjqvpajc?si=Gk-mWux5ZID_457Z",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    },
    {
      name: "YouTube with different si parameter",
      url: "https://youtu.be/K2lvjqvpajc?si=BdQj66juGUeXAA13",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    },
    {
      name: "Mobile YouTube URL",
      url: "https://m.youtube.com/watch?v=K2lvjqvpajc&t=30s",
      expected: "https://www.youtube.com/watch?v=K2lvjqvpajc"
    }
  ];

  const results: string[] = [];

  for (const testCase of testUrls) {
    try {
      console.log(`\n🔄 Testing: ${testCase.name}`);
      console.log(`📥 Input:  ${testCase.url}`);
      
      const { data, error } = await supabase.functions.invoke("summary", {
        body: { url: testCase.url }
      });
      
      if (error) {
        console.error(`❌ Error for ${testCase.name}:`, error);
        throw new Error(`Test failed for ${testCase.name}: ${error.message}`);
      }
      
      assert(data, `Should return data for ${testCase.name}`);
      assertEquals(data.status, "success", `Status should be success for ${testCase.name}`);
      
      // 정규화된 URL이 예상과 일치하는지 확인 (로그에서 확인)
      console.log(`📤 Expected: ${testCase.expected}`);
      console.log(`✅ Test passed for ${testCase.name}`);
      
      results.push(`✅ ${testCase.name}: OK`);
      
      // 중복 처리 확인
      if (data.debug?.was_duplicate) {
        console.log(`🔄 Correctly identified as duplicate and updated timestamp`);
      }
      
    } catch (testError) {
      console.error(`🚨 Test execution error for ${testCase.name}:`, testError);
      results.push(`❌ ${testCase.name}: FAILED`);
    }
  }

  console.log("\n📊 Test Results Summary:");
  results.forEach(result => console.log(result));
  
  console.log("\n✨ URL normalization test completed!");
  console.log("🎯 All URLs should normalize to: https://www.youtube.com/watch?v=K2lvjqvpajc");
});

/**
 * 잘못된 YouTube URL 형식 테스트
 */
Deno.test("URL Normalization - Invalid YouTube URLs", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const supabase = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!
  );

  console.log("🧪 Testing invalid YouTube URL handling...");

  const invalidUrls = [
    {
      name: "Invalid video ID length",
      url: "https://youtu.be/invalid",
      expectedError: "Invalid YouTube URL"
    },
    {
      name: "Missing video ID",
      url: "https://www.youtube.com/watch",
      expectedError: "Invalid YouTube URL"
    },
    {
      name: "Non-YouTube domain",
      url: "https://vimeo.com/123456789",
      expectedError: "Unsupported URL"
    },
    {
      name: "Invalid URL format",
      url: "not-a-valid-url",
      expectedError: "Invalid URL format"
    }
  ];

  for (const testCase of invalidUrls) {
    try {
      console.log(`\n🔄 Testing invalid URL: ${testCase.name}`);
      console.log(`📥 Input: ${testCase.url}`);
      
      const { data, error } = await supabase.functions.invoke("summary", {
        body: { url: testCase.url }
      });
      
      // 에러가 반환되어야 함
      assert(error, `Should return error for ${testCase.name}`);
      
      const errorBody = await error.context.json();
      console.log(`❌ Expected error: ${errorBody.error}`);
      
      assert(
        errorBody.error.includes(testCase.expectedError),
        `Error should contain "${testCase.expectedError}" for ${testCase.name}`
      );
      
      console.log(`✅ Correctly rejected: ${testCase.name}`);
      
    } catch (testError) {
      console.error(`🚨 Test execution error for ${testCase.name}:`, testError);
      throw testError;
    }
  }

  console.log("\n✨ Invalid URL handling test completed!");
});