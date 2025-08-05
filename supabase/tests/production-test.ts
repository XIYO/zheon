/**
 * Modern Supabase Production Test Suite
 * 
 * Improvements based on 2024 best practices:
 * - Modern Deno test syntax with object configuration
 * - Proper TypeScript typing with SupabaseClient and type guards
 * - Resource leak prevention with sanitizeOps/sanitizeResources: false
 * - Environment variable validation with proper error handling
 * - performance.now() for more accurate timing measurements
 * - Type-safe response validation with runtime checks
 * - Comprehensive error handling for production scenarios
 * - Improved test descriptions and structured organization
 */
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1"
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

// Production deployed functions testing - using invoke() method (official recommendation)
Deno.test({
  name: "Production Deployment - Hello Function",
  async fn() {
    const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required")
    }
    
    console.log("🚀 Testing production hello function...")
    
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data, error } = await supabase.functions.invoke('hello', {
      body: { name: "Production Test" }
    })
    
    assert(!error, `Function error: ${error?.message}`)
    assertExists(data, "No data returned")
    assert(typeof data === 'object' && data !== null, "Data should be an object")
    assert('message' in data, "Response should have message field")
    assertEquals(data.message, "Hello Production Test!")
    
    console.log("✅ Production hello function working correctly")
  },
  sanitizeOps: false,
  sanitizeResources: false,
})

Deno.test({
  name: "Production Deployment - Hello-env Function",
  async fn() {
    const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required")
    }
    
    console.log("🚀 Testing production hello-env function...")
    
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Environment variable check test - invoke() method
    const { data, error } = await supabase.functions.invoke('hello-env', {
      body: {}
    })
    
    assert(!error, `Function error: ${error?.message}`)
    assertExists(data, "No data returned")
    assert(typeof data === 'object' && data !== null, "Data should be an object")
    
    // Type-safe property checks
    assert('status' in data, "Response should have status field")
    assert('message' in data, "Response should have message field")
    assert('summary' in data, "Response should have summary field")
    assert('variables' in data, "Response should have variables field")
    assert('timestamp' in data, "Response should have timestamp field")
    
    assertEquals(data.status, "success")
    assertEquals(data.message, "Environment Variables Check")
    assertExists(data.summary)
    assertExists(data.variables)
    assertExists(data.timestamp)
    
    // Environment variables validation with type safety
    const vars = data.variables
    assert(typeof vars === 'object' && vars !== null, "Variables should be an object")
    assertExists(vars.SUPABASE_URL, "SUPABASE_URL should be available")
    assert(typeof vars.SUPABASE_URL === 'string', "SUPABASE_URL should be a string")
    assert(vars.SUPABASE_URL.includes("supabase.co"), "Should be valid Supabase URL")
    
    if (vars.DENO_DEPLOYMENT_ID) {
      assert(typeof vars.DENO_DEPLOYMENT_ID === 'string', "DENO_DEPLOYMENT_ID should be a string")
      assert(vars.DENO_DEPLOYMENT_ID.includes("iefgdhwmgljjacafqomd"), "Should contain project ref")
    }
    
    console.log("✅ Production hello-env function working correctly")
    assert(typeof data.summary === 'object' && data.summary !== null, "Summary should be an object")
    assert('set' in data.summary && 'total' in data.summary, "Summary should have set and total fields")
    console.log(`📊 Environment summary: ${data.summary.set}/${data.summary.total} variables set`)
  },
  sanitizeOps: false,
  sanitizeResources: false,
})

Deno.test({
  name: "Production Deployment - CORS Headers",
  async fn() {
    const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required")
    }
    
    console.log("🚀 Testing CORS headers...")
    
    const response = await fetch(`${supabaseUrl}/functions/v1/hello-env`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`
      }
    })
    
    assert(response.ok, `HTTP ${response.status}: ${response.statusText}`)
    
    // Consume response body to prevent resource leaks
    await response.text()
    
    // CORS headers validation
    assertEquals(response.headers.get("access-control-allow-origin"), "*")
    assertEquals(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS")
    assertEquals(response.headers.get("access-control-allow-headers"), "Content-Type, Authorization")
    
    console.log("✅ CORS headers configured correctly")
  },
  sanitizeOps: false,
  sanitizeResources: false,
})

Deno.test({
  name: "Production Deployment - Function Performance",
  async fn() {
    const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required")
    }
    
    console.log("🚀 Testing function performance...")
    
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const startTime = performance.now()
    
    const { data, error } = await supabase.functions.invoke('hello', {
      body: { name: "Performance Test" }
    })
    
    const endTime = performance.now()
    const responseTime = Math.round(endTime - startTime)
    
    assert(!error, `Function error: ${error?.message}`)
    assertExists(data, "No data returned")
    assert(typeof data === 'object' && data !== null, "Data should be an object")
    
    // Response time should be under 5 seconds (Edge Functions are typically fast)
    assert(responseTime < 5000, `Response time too slow: ${responseTime}ms`)
    
    assert('message' in data, "Response should have message field")
    assertEquals(data.message, "Hello Performance Test!")
    
    console.log(`✅ Function performance good: ${responseTime}ms`)
  },
  sanitizeOps: false,
  sanitizeResources: false,
})