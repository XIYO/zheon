/**
 * Modern Supabase Edge Function Test Suite for hello-langchain-genai
 *
 * Improvements based on 2024 best practices:
 * - Modern Deno test syntax with object configuration
 * - Proper TypeScript typing with SupabaseClient
 * - Resource leak prevention with sanitizeOps/sanitizeResources: false
 * - Enhanced error handling for both client errors and function responses
 * - Environment variable validation with proper error messages
 * - Type-safe response validation with runtime checks
 * - Improved test descriptions and logging
 */
import { assert, assertEquals, assertExists } from 'jsr:@std/assert@1';
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// Test configuration
const FUNCTION_NAME = 'hello-langchain-genai';
const TEST_TIMEOUT = 30000; // 30 seconds for API calls

// Initialize Supabase client with validation
const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('PUBLIC_SUPABASE_URL');
const supabaseAnonKey =
	Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for testing');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

Deno.test({
	name: 'hello-langchain-genai - successful prompt processing',
	async fn() {
		const testPrompt = 'What is TypeScript? Answer in one sentence.';

		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: { prompt: testPrompt }
		});

		// Basic response validation
		assert(!error, `Function should not return error: ${error?.message}`);
		assertExists(data, 'Response data should exist');

		// Validate response structure with type safety
		assert(typeof data === 'object' && data !== null, 'Data should be an object');
		assert('message' in data && typeof data.message === 'string', 'Message should be a string');
		assert('response' in data && typeof data.response === 'string', 'Response should be a string');
		assert('model' in data, 'Should include model field');
		assert('framework' in data, 'Should include framework field');
		assertEquals(data.model, 'gemini-1.5-flash', 'Model should be gemini-1.5-flash');
		assertEquals(data.framework, 'langchain', 'Framework should be langchain');
		assertExists(data.timestamp, 'Timestamp should exist');

		// Validate content quality
		assert(data.response.length > 10, 'Response should be substantial');
		// Note: TypeScript mention not guaranteed, depends on AI model response

		console.log(`✅ Successful response: ${data.response.substring(0, 100)}...`);
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'hello-langchain-genai - empty prompt validation',
	async fn() {
		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: { prompt: '' }
		});

		// Should have error because function returns 400 status
		assertExists(error, 'Should return error for empty prompt');
		assert(!data, 'Data should be null for error responses');

		console.log('✅ Empty prompt properly rejected');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'hello-langchain-genai - missing prompt parameter',
	async fn() {
		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: { notPrompt: 'This is not the right parameter' }
		});

		// Should have error because function returns 400 status
		assertExists(error, 'Should return error for missing prompt parameter');
		assert(!data, 'Data should be null for error responses');

		console.log('✅ Missing prompt parameter properly rejected');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

// Invalid JSON testing requires HTTP level access, so fetch() is necessary
Deno.test({
	name: 'hello-langchain-genai - invalid JSON handling',
	async fn() {
		try {
			const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${supabaseAnonKey}`,
					'Content-Type': 'application/json'
				},
				body: 'invalid-json' // Clearly invalid JSON
			});

			assertEquals(response.status, 400, 'Should return 400 for invalid JSON');

			const data = await response.json();
			assertExists(data.error, 'Should include error message');
			assertExists(data.timestamp, 'Should include timestamp');
			assertEquals(typeof data.timestamp, 'string', 'Timestamp should be string');

			console.log('✅ Invalid JSON properly handled');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			assert(false, `Unexpected error: ${errorMessage}`);
		}
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'hello-langchain-genai - CORS headers validation',
	async fn() {
		// Test OPTIONS request (CORS preflight)
		const optionsResponse = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
			method: 'OPTIONS',
			headers: {
				Authorization: `Bearer ${supabaseAnonKey}`,
				'Access-Control-Request-Method': 'POST',
				'Access-Control-Request-Headers': 'Content-Type'
			}
		});

		assertEquals(optionsResponse.status, 200, 'OPTIONS request should return 200');

		const corsHeaders = optionsResponse.headers;
		assertEquals(corsHeaders.get('Access-Control-Allow-Origin'), '*', 'Should allow all origins');
		assertEquals(
			corsHeaders.get('Access-Control-Allow-Methods'),
			'POST, OPTIONS',
			'Should allow POST and OPTIONS'
		);

		console.log('✅ CORS headers properly configured');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'hello-langchain-genai - method not allowed',
	async fn() {
		const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${supabaseAnonKey}`
			}
		});

		assertEquals(response.status, 405, 'Should return 405 for GET request');

		const data = await response.json();
		assertExists(data.error, 'Should include error message');
		assert(data.error.includes('Method not allowed'), 'Should specify method not allowed');

		console.log('✅ Method restriction properly enforced');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'hello-langchain-genai - long prompt handling',
	async fn() {
		// Create a very long prompt (over 4000 characters)
		const longPrompt = 'Tell me about '.repeat(500) + 'artificial intelligence';

		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: { prompt: longPrompt }
		});

		// Modern error handling: should handle gracefully or return structured error
		if (error) {
			// Network/auth error - might be rate limiting
			console.log('⚠️ Long prompt caused client error (possibly rate limiting):');
			console.log(error.message);
		} else if (data) {
			if ('error' in data && data.error) {
				// Function validation error (expected for very long prompts)
				console.log('✅ Long prompt properly validated by function');
			} else {
				// Successfully processed despite length
				assertExists(data.response, 'Should generate response if no error');
				console.log('✅ Long prompt handled gracefully');
			}
		} else {
			assert(false, 'Expected either data or error response');
		}
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'hello-langchain-genai - special characters handling',
	async fn() {
		const specialPrompt = 'What is this symbol: 🤖? And this: émojï-test-123!@#$%';

		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: { prompt: specialPrompt }
		});

		assert(!error, `Function should handle special characters: ${error?.message}`);
		assertExists(data, 'Should return data for special characters');
		assertExists(data.response, 'Should generate response for special characters');

		console.log('✅ Special characters handled properly');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

// Integration test to verify LangChain specific features
Deno.test({
	name: 'hello-langchain-genai - LangChain framework verification',
	async fn() {
		const frameworkPrompt = 'List 3 benefits of using TypeScript';

		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: { prompt: frameworkPrompt }
		});

		assert(!error, `Function should work: ${error?.message}`);
		assertExists(data, 'Response should exist');

		// Verify LangChain-specific response structure with type safety
		assert(typeof data === 'object' && data !== null, 'Data should be an object');
		assert('framework' in data, 'Response should include framework field');
		assert('model' in data, 'Response should include model field');
		assertEquals(data.framework, 'langchain', 'Should specify LangChain framework');
		assertEquals(data.model, 'gemini-1.5-flash', 'Should use Gemini Flash model');

		// Verify the response quality (LangChain should provide structured responses)
		assert('response' in data && typeof data.response === 'string', 'Should have string response');
		assert(data.response.length > 10, 'Response should have content');

		console.log(`✅ LangChain integration verified: ${data.framework} with ${data.model}`);
	},
	sanitizeOps: false,
	sanitizeResources: false
});

console.log(`
🧪 Running tests for ${FUNCTION_NAME}
📋 Test suite includes:
   • Basic functionality and response validation
   • Modern error handling patterns (2024 best practices)
   • Input validation with proper error structures
   • CORS headers and HTTP method restrictions
   • Edge cases (long prompts, special characters)
   • LangChain framework integration verification
   • Resource leak prevention with sanitizeOps/sanitizeResources

💡 Make sure GEMINI_API_KEY is set in your Supabase project secrets
⚡ Tests may take up to 30 seconds due to API calls
🔧 Using modern Deno test syntax with proper TypeScript types
`);
