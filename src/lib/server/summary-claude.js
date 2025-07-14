import { ANTHROPIC_API_KEY } from '$env/static/private';
import { Anthropic } from '@anthropic-ai/sdk';

/**
 * @param {string} transcript
 * @param {{ model?: string, lang?: 'ko'|'en' }} opts
 * @returns {Promise<{ title: string; summary: string; content: string }>}
 */
export async function summarizeTranscript(
	transcript,
	{ model = 'claude-3-5-haiku-20241022', lang = 'ko' } = {}
) {
	// Initialize Anthropic with API key from environment
	const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	// build speak directive
	const speakDirective = lang === 'en' ? 'Speak in English.' : 'Speak in Korean.';

	const systemPrompt = 'You are a professional video summarizer. Extract a title, a concise summary, and cleaned content from the transcript.';
	
	const userPrompt = `Below is the full transcript of a YouTube video. Clean filler words and redundant phrasing, preserve flow, then provide JSON output with keys title, summary, and content.

${speakDirective}

Return the result as a JSON object with the following structure:
{
  "title": "5-10 character concise title",
  "summary": "high-level summary of video",
  "content": "cleaned full transcript"
}

Transcript:
${transcript}`;

	const response = await anthropic.messages.create({
		model,
		max_tokens: 8192,
		temperature: 0.3,
		system: systemPrompt,
		messages: [
			{
				role: 'user',
				content: userPrompt
			}
		]
	});

	// Extract JSON from the response
	const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
	
	// Try to parse JSON from the response
	let parsed;
	try {
		// First, try to extract JSON from markdown code blocks
		const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		let jsonString = responseText;
		
		if (jsonMatch) {
			jsonString = jsonMatch[1];
		}
		
		// Clean the string - remove control characters and normalize whitespace
		jsonString = jsonString
			.trim()
			.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
			.replace(/\r\n/g, '\n') // Normalize line endings
			.replace(/\r/g, '\n')
			.replace(/\t/g, '  '); // Replace tabs with spaces
		
		// Try to parse the cleaned JSON
		parsed = JSON.parse(jsonString);
		
		// Validate the response structure
		if (!parsed.title || !parsed.summary || !parsed.content) {
			throw new Error('Invalid response structure');
		}
		
		// Clean the parsed content as well
		parsed.title = parsed.title.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
		parsed.summary = parsed.summary.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
		parsed.content = parsed.content.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
		
	} catch (error) {
		console.error('Failed to parse Claude response:', error);
		console.error('Response text:', responseText);
		
		// Fallback: try to extract content manually
		try {
			const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);
			const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/);
			const contentMatch = responseText.match(/"content"\s*:\s*"([\s\S]+?)"\s*\}/);
			
			if (titleMatch && summaryMatch && contentMatch) {
				parsed = {
					title: titleMatch[1].replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim(),
					summary: summaryMatch[1].replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim(),
					content: contentMatch[1].replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim()
				};
			} else {
				throw new Error('Could not extract required fields from response');
			}
		} catch (fallbackError) {
			console.error('Fallback parsing also failed:', fallbackError);
			throw new Error('Invalid function response');
		}
	}
	
	return parsed;
}