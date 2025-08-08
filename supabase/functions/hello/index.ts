// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js@2.4.5/edge-runtime.d.ts';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';

console.log('Hello from Functions!');

Deno.serve(async (req) => {
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	try {
		// Parse request body
		const body = await req.json();
		const { name } = body;

		// Validate name parameter
		if (!name || typeof name !== 'string') {
			return corsError('Name parameter is required and must be a string', 'INVALID_NAME', 400);
		}

		return corsResponse({
			message: `Hello ${name}!`,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return corsError('Internal server error', 'INTERNAL_ERROR', 500);
	}
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
