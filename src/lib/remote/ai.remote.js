import { command, form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { generateObject, experimental_generateSpeech as generateSpeech } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { valibotSchema } from '@ai-sdk/valibot';
import { env } from '$env/dynamic/private';
import { createLMNT } from '@ai-sdk/lmnt';
import { createElevenLabs } from '@ai-sdk/elevenlabs';
import { PROMPT_TEMPLATE } from '$lib/remote/prompt.js';

/**
 * @typedef {ReturnType<typeof createLMNT> | null} LmntClient
 * @typedef {ReturnType<typeof createElevenLabs> | null} ElevenLabsClient
 * @typedef {{
 *  id: 'lmnt' | 'elevenlabs';
 *  label: string;
 *  isEnabled: () => boolean;
 *  buildRequest: (args: { text: string }) => Record<string, unknown> | null;
 * }} TtsStrategy
 */

const LMNT_MODEL = env.LMNT_TTS_MODEL;
const LMNT_VOICE = env.LMNT_TTS_VOICE;
const LMNT_LANGUAGE = env.LMNT_TTS_LANGUAGE;
const LMNT_OUTPUT_FORMAT = env.LMNT_TTS_FORMAT;
const LMNT_SPEED = parseOptionalNumber(env.LMNT_TTS_SPEED);

const ELEVENLABS_MODEL = env.ELEVENLABS_TTS_MODEL;
const ELEVENLABS_VOICE = env.ELEVENLABS_TTS_VOICE;
const ELEVENLABS_OUTPUT_FORMAT = env.ELEVENLABS_TTS_FORMAT;
const ELEVENLABS_SPEED = parseOptionalNumber(env.ELEVENLABS_TTS_SPEED);

/** @type {Record<string, string>} */
const AUDIO_MIME_EXTENSION_MAP = {
	'audio/mpeg': 'mp3',
	'audio/mp3': 'mp3',
	'audio/wav': 'wav',
	'audio/x-wav': 'wav',
	'audio/ogg': 'ogg',
	'audio/webm': 'webm'
};

/**
 * Valibot 스키마 정의 - 구조화된 요약 출력
 */
const SummarySchema = valibotSchema(
	v.object({
		summary: v.pipe(v.string(), v.minLength(200), v.maxLength(1000))
	})
);


/** @type<{ lmnt: LmntClient; elevenlabs: ElevenLabsClient } | undefined> */
let cachedTtsProviders;

function getTtsProviders() {
	if (cachedTtsProviders) return cachedTtsProviders;

	cachedTtsProviders = {
		lmnt: env.LMNT_API_KEY ? createLMNT({ apiKey: env.LMNT_API_KEY }) : null,
		elevenlabs: env.ELEVENLABS_API_KEY ? createElevenLabs({ apiKey: env.ELEVENLABS_API_KEY }) : null
	};

	return cachedTtsProviders;
}

function buildTtsStrategies() {
	const providers = getTtsProviders();

	/** @type {TtsStrategy[]} */
	return [
		{
			id: 'lmnt',
			label: 'LMNT',
			isEnabled: () => Boolean(providers.lmnt),
			buildRequest: ({ text }) => {
				if (!providers.lmnt) return null;

				const request = {
					model: providers.lmnt.speech(LMNT_MODEL),
					text
				};

				if (LMNT_VOICE) /** @type {any} */ (request).voice = LMNT_VOICE;
				if (LMNT_LANGUAGE) /** @type {any} */ (request).language = LMNT_LANGUAGE;
				if (LMNT_OUTPUT_FORMAT) /** @type {any} */ (request).outputFormat = LMNT_OUTPUT_FORMAT;
				if (typeof LMNT_SPEED === 'number') /** @type {any} */ (request).speed = LMNT_SPEED;

				return request;
			}
		},
		{
			id: 'elevenlabs',
			label: 'ElevenLabs',
			isEnabled: () => Boolean(providers.elevenlabs),
			buildRequest: ({ text }) => {
				if (!providers.elevenlabs) return null;

				const request = {
					model: providers.elevenlabs.speech(ELEVENLABS_MODEL),
					text,
					voice: ELEVENLABS_VOICE
				};

				if (ELEVENLABS_OUTPUT_FORMAT) /** @type {any} */ (request).outputFormat = ELEVENLABS_OUTPUT_FORMAT;
				if (typeof ELEVENLABS_SPEED === 'number') /** @type {any} */ (request).speed = ELEVENLABS_SPEED;

				return request;
			}
		}
	];
}

/**
 * @param {{ format?: string | null; mimeType?: string | null }} audio
 */
function resolveAudioExtension(audio) {
	if (!audio) return 'mp3';
	if (audio.format) return audio.format.toLowerCase();
	if (audio.mimeType && AUDIO_MIME_EXTENSION_MAP[audio.mimeType]) {
		return AUDIO_MIME_EXTENSION_MAP[audio.mimeType];
	}
	return 'mp3';
}

function parseOptionalNumber(value) {
	if (!value) return undefined;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Fisher-Yates shuffle (배열 랜덤 섞기)
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffleArray(array) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Command: AI 요약 생성
 * Vercel AI SDK + Gemini를 사용한 요약 생성
 */
export const summarizeTranscript = command(
	v.object({
		transcript: v.pipe(
			v.string(),
			v.minLength(1),
			v.transform((s) => s.trim())
		),
		language: v.string()
	}),
	async ({ transcript, language }) => {
		const geminiApiKey = env.GEMINI_API_KEY;
		if (!geminiApiKey) throw error(500, 'GEMINI_API_KEY가 설정되지 않았습니다');

		try {
			const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
			const model = google('gemini-2.5-flash-lite-preview-09-2025');
			const prompt = PROMPT_TEMPLATE.replace('{transcript}', transcript);

			// AI 요약 생성 (Valibot 스키마로 구조화된 출력)
			const result = await generateObject({
				model,
				schema: SummarySchema,
				temperature: 0.3, // 일관성을 위해 낮은 temperature
				prompt
			});

			const generated = result.object;

			return {
				summary: generated.summary,
				language
			};
		} catch (err) {
			// 에러 메시지 처리
			const errorMessage = err instanceof Error ? err.message : String(err);

			if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
				throw error(429, 'API 할당량 초과. 나중에 다시 시도해주세요.');
			}

			if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
				throw error(500, 'AI 출력 검증 실패. 다시 시도해주세요.');
			}

			throw error(500, `AI 요약 생성 실패: ${errorMessage}`);
		}
	}
);

const GenerateTtsCommandSchema = v.object({
	summaryId: v.pipe(
		v.string('요약 ID가 필요합니다'),
		v.trim(),
		v.nonEmpty('요약 ID가 필요합니다')
	)
});

const GenerateTtsFormSchema = v.object({
	summaryId: v.pipe(
		v.string('요약 ID가 필요합니다'),
		v.trim(),
		v.nonEmpty('요약 ID가 필요합니다')
	)
});

async function extracted(summaryId, speechText) {
	const { locals } = getRequestEvent();
	const { adminSupabase } = locals;

	const updateStatus = async (status, audioUrl = null) => {
		const updateData = { summary_audio_status: status };
		if (audioUrl) {
			updateData.summary_audio_url = audioUrl;
		}

		const { error: updateError } = await adminSupabase
			.from('summary')
			.update(updateData)
			.eq('id', summaryId);

		if (updateError) throw new Error(`상태 업데이트 실패: ${updateError.message}`);
	};

	const strategies = buildTtsStrategies();
	const enabledStrategies = strategies.filter((strategy) => strategy.isEnabled());

	if (enabledStrategies.length === 0) {
		throw error(500, 'LMNT 또는 ElevenLabs의 API 키를 환경 변수로 설정해주세요.');
	}

	// 랜덤 순서로 TTS 제공자 시도
	const randomizedStrategies = shuffleArray(enabledStrategies);

	await updateStatus('processing');

	const generationErrors = [];
	let speechResult = null;
	let providerId = null;

	for (const strategy of randomizedStrategies) {
		try {
			console.log(`[TTS] ${strategy.label} 시도 중...`);

			const request = strategy.buildRequest({ text: speechText });
			if (!request) continue;

			const result = await generateSpeech(request);
			if (!result?.audio?.uint8Array?.length) {
				throw new Error('오디오 데이터가 생성되지 않았습니다');
			}

			speechResult = result;
			providerId = strategy.id;
			console.log(`[TTS] ${strategy.label} 성공`);
			break;
		} catch (generationError) {
			const message =
				generationError instanceof Error ? generationError.message : String(generationError);
			console.error(`[TTS] ${strategy.label} 실패:`, generationError);
			generationErrors.push(`${strategy.label}: ${message}`);
		}
	}

	if (!speechResult || !providerId) {
		const combinedMessage =
			generationErrors.length > 0 ? generationErrors.join(' | ') : '알 수 없는 오류';
		try {
			await updateStatus('failed');
		} catch (statusError) {
			console.error('[TTS] 상태 업데이트 실패(모든 시도 실패):', statusError);
		}
		throw error(502, `모든 음성 생성 시도가 실패했습니다. 할당량이 모두 소진되었을 수 있습니다. 상세: ${combinedMessage}`);
	}

	try {
		const { audio } = speechResult;
		const extension = resolveAudioExtension(audio);
		const fileName = `summaries/${summaryId}_summary_${Date.now()}.${extension}`;

		// Private 버킷에 업로드
		const { error: uploadError } = await adminSupabase.storage
			.from('audio')
			.upload(fileName, audio.uint8Array, {
				contentType: audio.mimeType ?? 'audio/mpeg',
				upsert: true
			});

		if (uploadError) throw uploadError;

		// Storage path 저장 (publicUrl 대신)
		await updateStatus('completed', fileName);

		console.log(`[TTS] 완료: ${fileName} (Provider: ${providerId})`);

		return { audioPath: fileName, section: 'summary', summaryId, provider: providerId };
	} catch (err) {
		try {
			await updateStatus('failed');
		} catch (statusError) {
			console.error('[TTS] 상태 업데이트 실패(에러 처리 중):', statusError);
		}

		const errorMessage = err instanceof Error ? err.message : String(err);

		if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
			throw error(429, 'API 할당량 초과');
		}

		throw error(500, `TTS 생성 실패: ${errorMessage}`);
	}
}

/**
 * @param {{ summaryId: string }} input
 */
async function runGenerateTts({ summaryId }) {
	const { locals } = getRequestEvent();
	const { adminSupabase } = locals;

	const { data: summaryRecord, error: fetchError } = await adminSupabase
		.from('summary')
		.select('summary')
		.eq('id', summaryId)
		.single();

	if (fetchError) throw error(404, '오류가 발생했습니다. 다시 시도해주세요.');
	if (!summaryRecord) throw error(404, '요약 정보를 찾을 수 없습니다.');

	const speechText = summaryRecord.summary;
	if (!speechText) throw error(400, '아직 요약된 정보가 없습니다.');

	// 백그라운드로 TTS 생성 처리
	try {
		const { waitUntil } = await import('cloudflare:workers');
		waitUntil(extracted(summaryId, speechText).catch(err => {
			console.error('[TTS] Background processing failed:', err);
		}));
	} catch {
		// waitUntil 없으면 그냥 실행 (에러는 로깅만)
		extracted(summaryId, speechText).catch(err => {
			console.error('[TTS] Background processing failed:', err);
		});
	}
}

export const generateTtsAudio = command(GenerateTtsCommandSchema, runGenerateTts);

/**
 * Form: TTS 생성 (요약 전용)
 * LMNT → Hume → ElevenLabs 순서로 AI SDK 스피치 프로바이더를 시도
 */
export const generateTTS = form(GenerateTtsFormSchema, async ({ summaryId }) =>
	runGenerateTts({ summaryId })
);
