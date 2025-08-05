import { createClient } from "jsr:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("PUBLIC_SUPABASE_URL")!,
  Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!
)

console.log("🧪 Testing RPC function directly...")

// 1. RPC 함수 테스트 (이미 저장된 영상)
const testUrl = 'https://www.youtube.com/watch?v=W5tBfYIhWok'
console.log(`📎 Testing with URL: ${testUrl}`)

const { data: rpcResult, error: rpcError } = await supabase
  .rpc('check_existing_summary', {
    p_youtube_url: testUrl
  })

if (rpcError) {
  console.error("❌ RPC Error:", rpcError)
} else {
  console.log("✅ RPC Result (existing ID):", rpcResult)
}

// 2. Edge Function 테스트 (이미 저장된 영상)
console.log("\n🧪 Testing Edge Function with existing video...")
const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('summary', {
  body: { url: testUrl }
})

if (edgeError) {
  console.error("❌ Edge Function Error:", edgeError)
  // 에러 상세 내용 확인
  try {
    const errorBody = await edgeError.context.text()
    console.error("Error details:", errorBody)
  } catch {}
} else {
  console.log("✅ Edge Function Result:", edgeResult)
}