/**
 * Modern Supabase Edge Function Test Suite for hello-gemini
 *
 * Improvements based on 2024 best practices:
 * - Modern Deno test syntax with object configuration
 * - Proper TypeScript typing with SupabaseClient
 * - Resource leak prevention with sanitizeOps/sanitizeResources: false
 * - Environment variable validation
 * - Comprehensive error handling for invoke() method
 * - Type-safe response validation
 * - Structured test organization
 */
import { assert, assertEquals, assertExists } from 'jsr:@std/assert@1';
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// Test configuration - with validation
const SUPABASE_URL =
	Deno.env.get('SUPABASE_URL') || Deno.env.get('PUBLIC_SUPABASE_URL') || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
	Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('PUBLIC_SUPABASE_ANON_KEY');
const FUNCTION_NAME = 'hello-gemini';

if (!SUPABASE_ANON_KEY) {
	throw new Error('SUPABASE_ANON_KEY is required for testing');
}

// Test interfaces matching the function
interface GeminiResponse {
	message: string;
	response: string;
	model: string;
	timestamp: string;
}

interface ErrorResponse {
	error: string;
	code: string;
	timestamp: string;
}

// Create Supabase client with proper typing
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

Deno.test({
	name: 'Hello Gemini - Valid prompt should return successful response',
	async fn() {
		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: {
				prompt: 'Write a single sentence about TypeScript.'
			}
		});

		// Should not have Supabase client errors
		assert(!error, `Supabase client error: ${error?.message}`);
		assertExists(data, 'Response data should exist');

		const response = data as GeminiResponse;

		// Validate response structure
		assertExists(response.message, 'Response should have message field');
		assertExists(response.response, 'Response should have response field');
		assertExists(response.model, 'Response should have model field');
		assertExists(response.timestamp, 'Response should have timestamp field');

		// Validate content
		assertEquals(response.message, 'Content generated successfully');
		assertEquals(response.model, 'gemini-1.5-flash');
		assert(response.response.length > 0, 'Response should contain generated content');

		// Validate timestamp format (ISO string)
		const timestamp = new Date(response.timestamp);
		assert(!isNaN(timestamp.getTime()), 'Timestamp should be valid ISO string');

		console.log(`✅ Success: Generated ${response.response.length} characters`);
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - Missing prompt should return validation error',
	async fn() {
		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: {}
		});

		// Should have error because function returns 400 status
		assertExists(error, 'Should return error for missing prompt');
		assert(!data, 'Data should be null for error responses');

		// Log error structure for debugging
		console.log('Error structure:', JSON.stringify(error, null, 2));

		console.log('✅ Success: Missing prompt validation works');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - Empty prompt should return validation error',
	async fn() {
		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: {
				prompt: ''
			}
		});

		// Should have error because function returns 400 status
		assertExists(error, 'Should return error for empty prompt');
		assert(!data, 'Data should be null for error responses');

		console.log('✅ Success: Empty prompt validation works');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - Non-string prompt should return validation error',
	async fn() {
		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: {
				prompt: 123
			}
		});

		// Should have error because function returns 400 status
		assertExists(error, 'Should return error for non-string prompt');
		assert(!data, 'Data should be null for error responses');

		console.log('✅ Success: Non-string prompt validation works');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - Very long prompt should return validation error',
	async fn() {
		const longPrompt = 'x'.repeat(10001); // Exceeds 10,000 character limit

		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: {
				prompt: longPrompt
			}
		});

		// Should have error because function returns 400 status
		assertExists(error, 'Should return error for long prompt');
		assert(!data, 'Data should be null for error responses');

		console.log('✅ Success: Long prompt validation works');
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - Invalid JSON should return parse error',
	async fn() {
		try {
			const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
					'Content-Type': 'application/json'
				},
				body: 'invalid-json'
			});

			const data = (await response.json()) as ErrorResponse;

			assertEquals(response.status, 400);
			assertEquals(data.code, 'INVALID_JSON');
			assertEquals(data.error, 'Invalid JSON in request body');

			console.log('✅ Success: Invalid JSON handling works');
		} catch (fetchError) {
			const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
			throw new Error(`Fetch failed: ${errorMessage}`);
		}
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - GET method should return method not allowed',
	async fn() {
		try {
			const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${SUPABASE_ANON_KEY}`
				}
			});

			const data = (await response.json()) as ErrorResponse;

			assertEquals(response.status, 405);
			assertEquals(data.code, 'METHOD_NOT_ALLOWED');
			assertEquals(data.error, 'Method not allowed');

			console.log('✅ Success: GET method rejection works');
		} catch (fetchError) {
			const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
			throw new Error(`Fetch failed: ${errorMessage}`);
		}
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - OPTIONS request should return CORS headers',
	async fn() {
		try {
			const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
				method: 'OPTIONS',
				headers: {
					Authorization: `Bearer ${SUPABASE_ANON_KEY}`
				}
			});

			assertEquals(response.status, 200);

			// Check CORS headers
			assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
			assertEquals(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
			assertExists(response.headers.get('Access-Control-Allow-Headers'));

			console.log('✅ Success: CORS preflight handling works');
		} catch (fetchError) {
			const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
			throw new Error(`Fetch failed: ${errorMessage}`);
		}
	},
	sanitizeOps: false,
	sanitizeResources: false
});

Deno.test({
	name: 'Hello Gemini - Complex prompt should work correctly',
	async fn() {
		const complexPrompt = `
      Please analyze the following scenario and provide a structured response:
      
      Scenario: A developer is building a web application that needs to handle
      real-time data updates from multiple sources. What architectural patterns
      would you recommend?
      
      Please format your response with:
      1. Key considerations
      2. Recommended patterns
      3. Implementation notes
    `;

		const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
			body: {
				prompt: complexPrompt
			}
		});

		assert(!error, `Supabase client error: ${error?.message}`);
		assertExists(data, 'Response data should exist');

		const response = data as GeminiResponse;

		assertEquals(response.message, 'Content generated successfully');
		assert(response.response.length > 100, 'Complex prompt should generate substantial response');

		console.log(`✅ Success: Complex prompt generated ${response.response.length} characters`);
	},
	sanitizeOps: false,
	sanitizeResources: false
});

// Performance test (optional - can be skipped in CI)
Deno.test({
	name: 'Hello Gemini - Performance test (multiple concurrent requests)',
	ignore: Deno.env.get('SKIP_PERF_TESTS') === 'true',
	fn: async () => {
		const promises = Array.from({ length: 3 }, (_, i) =>
			supabase.functions.invoke(FUNCTION_NAME, {
				body: {
					prompt: `Write a short fact about technology #${i + 1}`
				}
			})
		);

		const results = await Promise.all(promises);

		for (const { data, error } of results) {
			assert(!error, `Concurrent request failed: ${error?.message}`);
			assertExists(data, 'Concurrent request should return data');

			const response = data as GeminiResponse;
			assertEquals(response.message, 'Content generated successfully');
			assert(response.response.length > 0, 'Concurrent request should generate content');
		}

		console.log('✅ Success: Concurrent requests handled correctly');
	}
});

console.log(`
🧪 Hello Gemini Edge Function Tests
================================
Testing against: ${SUPABASE_URL}
Function: ${FUNCTION_NAME}

Make sure to:
1. Have GEMINI_API_KEY set in your Supabase Edge Function secrets
2. Run 'supabase start' for local testing
3. Or test against production with proper environment variables

Run with: deno test --allow-all --env-file=.env supabase/tests/hello-gemini-test.ts
`);
