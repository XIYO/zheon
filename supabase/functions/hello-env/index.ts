// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js@2.4.5/edge-runtime.d.ts';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';

console.log('Hello Environment Variables!');

Deno.serve((req) => {
	const validation = corsValidation(req, ['GET', 'POST']);
	if (validation) return validation;

	try {
		// 환경변수 수집
		const envVars = {
			// Supabase 환경변수
			SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
			SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? '***설정됨***' : undefined,
			SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
				? '***설정됨***'
				: undefined,

			// API Keys
			GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY') ? '***설정됨***' : undefined,
			OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? '***설정됨***' : undefined,
			ANTHROPIC_API_KEY: Deno.env.get('ANTHROPIC_API_KEY') ? '***설정됨***' : undefined,

			// 기타
			EXTRACT_API_URL: Deno.env.get('EXTRACT_API_URL'),

			// Deno 시스템 환경변수
			DENO_DEPLOYMENT_ID: Deno.env.get('DENO_DEPLOYMENT_ID'),
			SUPABASE_DB_URL: Deno.env.get('SUPABASE_DB_URL') ? '***설정됨***' : undefined
		};

		// 설정된 환경변수 개수 계산
		const totalVars = Object.keys(envVars).length;
		const setVars = Object.values(envVars).filter((v) => v !== undefined).length;

		const data = {
			message: 'Environment Variables Check',
			status: 'success',
			summary: {
				total: totalVars,
				set: setVars,
				missing: totalVars - setVars
			},
			variables: envVars,
			timestamp: new Date().toISOString()
		};

		return corsResponse(data);
	} catch (error) {
		console.error('Environment variables function error:', error);
		return corsError('Internal server error', 'INTERNAL_ERROR', 500);
	}
});
