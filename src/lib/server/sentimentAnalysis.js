import { env } from '$env/dynamic/private';

const BATCH_SIZE = 100;

export function createBatches(items, batchSize = BATCH_SIZE) {
	const batches = [];
	for (let i = 0; i < items.length; i += batchSize) {
		batches.push(items.slice(i, i + batchSize));
	}
	return batches;
}

export function buildPrompt(comments) {
	const commentsList = comments
		.map((c, i) => `${i + 1}. [ID: ${c.comment_id}] "${c.text_original}"`)
		.join('\n');

	return `Analyze the sentiment of the following ${comments.length} YouTube comments.
Classify each comment as positive, neutral, or negative.
Provide a confidence score from 0 to 1.

Return the results in JSON format with the exact structure specified.

[Comment List]
${commentsList}

Respond with ONLY valid JSON matching the specified schema.`;
}

export async function callGeminiAPI(batch) {
	const prompt = buildPrompt(batch);

	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('GEMINI_API_KEY not set');

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					responseMimeType: 'application/json',
					responseSchema: {
						type: 'object',
						properties: {
							results: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										comment_id: { type: 'string' },
										sentiment: {
											type: 'string',
											enum: ['positive', 'neutral', 'negative']
										},
										confidence: { type: 'number' }
									},
									required: ['comment_id', 'sentiment', 'confidence']
								}
							}
						},
						required: ['results']
					}
				}
			})
		}
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Gemini API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

	if (!content) throw new Error('No content in response');

	const parsed = JSON.parse(content);
	return parsed.results;
}

export function calculateTrendDirection(scores) {
	if (scores.length < 2) return 'stable';

	const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
	const secondHalf = scores.slice(Math.floor(scores.length / 2));

	const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
	const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

	const change = secondAvg - firstAvg;
	const threshold = 2;

	if (change > threshold) return 'improving';
	if (change < -threshold) return 'declining';
	return 'stable';
}

export function detectSuspiciousComments(comments) {
	const SPAM_KEYWORDS = [
		'click here',
		'visit',
		'buy now',
		'subscribe',
		'promo code',
		'affiliate',
		'link',
		'check this out'
	];

	const MISINFORMATION_MARKERS = [
		'fake news',
		'hoax',
		'conspiracy',
		'debunked',
		'false claim',
		'misleading'
	];

	const suspicious = [];

	for (const comment of comments) {
		let score = 0;
		const text = comment.text_original.toLowerCase();
		const flags = [];

		if (SPAM_KEYWORDS.some((k) => text.includes(k))) {
			score += 0.3;
			flags.push('spam_keywords');
		}

		if (text.includes('http://') || text.includes('https://')) {
			score += 0.2;
			flags.push('contains_link');
		}

		if (MISINFORMATION_MARKERS.some((m) => text.includes(m))) {
			score += 0.4;
			flags.push('misinformation_marker');
		}

		const capLetters = text.match(/[A-Z]/g) || [];
		if (capLetters.length / text.length > 0.3) {
			score += 0.15;
			flags.push('excessive_caps');
		}

		if (score > 0.3) {
			suspicious.push({
				comment_id: comment.comment_id,
				suspicion_score: Math.round(score * 100) / 100,
				flags
			});
		}
	}

	return suspicious.sort((a, b) => b.suspicion_score - a.suspicion_score);
}
