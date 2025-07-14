import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

/** @typedef {import('openai').ChatCompletionMessageParam} ChatCompletionMessageParam */
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * @param {string} transcript
 * @param {{ model?: string, lang?: 'ko'|'en' }} opts
 * @returns {Promise<{ title: string; summary: string; content: string }>}
 */
export async function summarizeTranscript(
	transcript,
	{ model = 'gpt-4.1-nano', lang = 'ko' } = {}
) {
	// build speak directive
	const speakDirective = lang === 'en' ? 'Speak in English.' : 'Speak in Korean.';

	// Single structured call to extract title, summary, and content
	const messages = [
		{
			role: 'system',
			content:
				'You are a professional video summarizer. Extract a title, a concise summary, and cleaned content from the transcript.'
		},
		{
			role: 'user',
			content: `Below is the full transcript of a YouTube video. Clean filler words and redundant phrasing, preserve flow, then provide JSON output with keys title, summary, and content.\n\nTranscript:\n${transcript}\n\n${speakDirective}`
		}
	];
	const schema = {
		type: 'object',
		properties: {
			title: { type: 'string', description: '5-10 character concise title' },
			summary: { type: 'string', description: 'high-level summary of video' },
			content: { type: 'string', description: 'cleaned full transcript' }
		},
		required: ['title', 'summary', 'content'],
		additionalProperties: false
	};
	const completion = await openai.chat.completions.create({
		model,
		messages: /** @type any */ (messages),
		functions: [
			{
				name: 'formatSummary',
				description: 'Extract title, summary, and content from transcript',
				parameters: schema
			}
		],
		function_call: { name: 'formatSummary' },
		temperature: 0.3
	});
	const raw = completion.choices?.[0]?.message?.function_call?.arguments || '{}';
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('Invalid function response');
	}
	return parsed;
}
