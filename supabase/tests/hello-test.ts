import { assert, assertEquals } from "jsr:@std/assert"
import { createClient } from "jsr:@supabase/supabase-js@2"

// 환경 변수 검증
Deno.test("Environment Variables", () => {
  const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")
  
  assert(supabaseUrl, "PUBLIC_SUPABASE_URL not found")
  assert(supabaseAnonKey, "PUBLIC_SUPABASE_ANON_KEY not found")
  
  console.log("✅ Environment variables loaded")
})

// Hello 함수 테스트 - invoke() 방식 사용 (공식 권장)
Deno.test({
  name: "Hello Function",
  async fn() {
    const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data, error } = await supabase.functions.invoke('hello', {
      body: { name: "World" }
    })
    
    assert(!error, `Function error: ${error?.message}`)
    assert(data, "No data returned")
    assertEquals(data.message, "Hello World!")
    
    console.log("✅ Hello function test passed:", data)
  },
  sanitizeOps: false,
  sanitizeResources: false
})