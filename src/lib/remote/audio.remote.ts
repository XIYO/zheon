import { command, form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { createLMNT } from '@ai-sdk/lmnt';
import { createElevenLabs } from '@ai-sdk/elevenlabs';
import { env } from '$env/dynamic/private';

const LMNT_MODEL = env.LMNT_TTS_MODEL;
const LMNT_VOICE = env.LMNT_TTS_VOICE;
const LMNT_LANGUAGE = env.LMNT_TTS_LANGUAGE;
const LMNT_OUTPUT_FORMAT = env.LMNT_TTS_FORMAT;
const LMNT_SPEED = parseOptionalNumber(env.LMNT_TTS_SPEED);

const ELEVENLABS_MODEL = env.ELEVENLABS_TTS_MODEL;
const ELEVENLABS_VOICE = env.ELEVENLABS_TTS_VOICE;
const ELEVENLABS_OUTPUT_FORMAT = env.ELEVENLABS_TTS_FORMAT;
const ELEVENLABS_SPEED = parseOptionalNumber(env.ELEVENLABS_TTS_SPEED);

const AUDIO_MIME_EXTENSION_MAP: Record<string, string> = {
	'audio/mpeg': 'mp3',
	'audio/mp3': 'mp3',
	'audio/wav': 'wav',
	'audio/x-wav': 'wav',
	'audio/ogg': 'ogg',
	'audio/webm': 'webm'
};

interface TtsStrategy {
	id: 'lmnt' | 'elevenlabs';
	label: string;
	isEnabled: () => boolean;
	buildRequest: (_args: { text: string }) => Record<string, unknown> | null;
}

let cachedTtsProviders:
	| {
			lmnt: ReturnType<typeof createLMNT> | null;
			elevenlabs: ReturnType<typeof createElevenLabs> | null;
	  }
	| undefined;

function parseOptionalNumber(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function getTtsProviders() {
	if (cachedTtsProviders) return cachedTtsProviders;

	cachedTtsProviders = {
		lmnt: env.LMNT_API_KEY ? createLMNT({ apiKey: env.LMNT_API_KEY }) : null,
		elevenlabs: env.ELEVENLABS_API_KEY ? createElevenLabs({ apiKey: env.ELEVENLABS_API_KEY }) : null
	};

	return cachedTtsProviders;
}

function buildTtsStrategies(): TtsStrategy[] {
	const providers = getTtsProviders();

	return [
		{
			id: 'lmnt',
			label: 'LMNT',
			isEnabled: () => Boolean(providers.lmnt),
			buildRequest: ({ text }) => {
				if (!providers.lmnt) return null;

				const request: Record<string, unknown> = {
					model: providers.lmnt.speech(LMNT_MODEL),
					text
				};

				if (LMNT_VOICE) request.voice = LMNT_VOICE;
				if (LMNT_LANGUAGE) request.language = LMNT_LANGUAGE;
				if (LMNT_OUTPUT_FORMAT) request.outputFormat = LMNT_OUTPUT_FORMAT;
				if (typeof LMNT_SPEED === 'number') request.speed = LMNT_SPEED;

				return request;
			}
		},
		{
			id: 'elevenlabs',
			label: 'ElevenLabs',
			isEnabled: () => Boolean(providers.elevenlabs),
			buildRequest: ({ text }) => {
				if (!providers.elevenlabs) return null;

				const request: Record<string, unknown> = {
					model: providers.elevenlabs.speech(ELEVENLABS_MODEL),
					text,
					voice: ELEVENLABS_VOICE
				};

				if (ELEVENLABS_OUTPUT_FORMAT) request.outputFormat = ELEVENLABS_OUTPUT_FORMAT;
				if (typeof ELEVENLABS_SPEED === 'number') request.speed = ELEVENLABS_SPEED;

				return request;
			}
		}
	];
}

function resolveAudioExtension(audio: { format?: string; mimeType?: string } | null): string {
	if (!audio) return 'mp3';
	if (audio.format) return audio.format.toLowerCase();
	if (audio.mimeType && AUDIO_MIME_EXTENSION_MAP[audio.mimeType]) {
		return AUDIO_MIME_EXTENSION_MAP[audio.mimeType];
	}
	return 'mp3';
}

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export const getAudioSignedUrl = command(
	v.object({
		summaryId: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ summaryId }) => {
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		const { data: summary, error: dbError } = await adminSupabase
			.from('summaries')
			.select('summary_audio_url')
			.eq('id', summaryId)
			.single();

		if (dbError) throw error(404, dbError.message);

		const storagePath = summary.summary_audio_url;

		if (!storagePath) {
			throw error(404, 'Audio file not found');
		}

		const { data: signedData, error: signError } = await adminSupabase.storage
			.from('audio')
			.createSignedUrl(storagePath, 60);

		if (signError) throw error(500, signError.message);

		return {
			url: signedData.signedUrl,
			expiresIn: 60
		};
	}
);

const GenerateTtsCommandSchema = v.object({
	summaryId: v.pipe(v.string('요약 ID가 필요합니다'), v.trim(), v.nonEmpty('요약 ID가 필요합니다'))
});

const GenerateTtsFormSchema = v.object({
	summaryId: v.pipe(v.string('요약 ID가 필요합니다'), v.trim(), v.nonEmpty('요약 ID가 필요합니다'))
});

async function generateTtsAudioInternal(summaryId: string, speechText: string) {
	const { locals } = getRequestEvent();
	const { adminSupabase } = locals;

	const updateStatus = async (status: string, audioUrl: string | null = null) => {
		const updateData: Record<string, unknown> = { summary_audio_status: status };
		if (audioUrl) {
			updateData.summary_audio_url = audioUrl;
		}

		const { error: updateError } = await adminSupabase
			.from('summaries')
			.update(updateData)
			.eq('id', summaryId);

		if (updateError) throw new Error(`상태 업데이트 실패: ${updateError.message}`);
	};

	const strategies = buildTtsStrategies();
	const enabledStrategies = strategies.filter((strategy) => strategy.isEnabled());

	if (enabledStrategies.length === 0) {
		throw error(500, 'LMNT 또는 ElevenLabs의 API 키를 환경 변수로 설정해주세요.');
	}

	const randomizedStrategies = shuffleArray(enabledStrategies);

	await updateStatus('processing');

	const generationErrors: string[] = [];
	let speechResult: { audio: { uint8Array?: Uint8Array; mimeType?: string } } | null = null;
	let providerId: string | null = null;

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
		throw error(
			502,
			`모든 음성 생성 시도가 실패했습니다. 할당량이 모두 소진되었을 수 있습니다. 상세: ${combinedMessage}`
		);
	}

	try {
		const { audio } = speechResult;
		const extension = resolveAudioExtension(audio);
		const fileName = `summaries/${summaryId}_summary_${Date.now()}.${extension}`;

		const { error: uploadError } = await adminSupabase.storage
			.from('audio')
			.upload(fileName, audio.uint8Array, {
				contentType: audio.mimeType ?? 'audio/mpeg',
				upsert: true
			});

		if (uploadError) throw uploadError;

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

async function runGenerateTts({ summaryId }: { summaryId: string }) {
	const { locals } = getRequestEvent();
	const { adminSupabase } = locals;

	const { data: summaryRecord, error: fetchError } = await adminSupabase
		.from('summaries')
		.select('summary')
		.eq('id', summaryId)
		.single();

	if (fetchError) throw error(404, '오류가 발생했습니다. 다시 시도해주세요.');
	if (!summaryRecord) throw error(404, '요약 정보를 찾을 수 없습니다.');

	const speechText = summaryRecord.summary;
	if (!speechText) throw error(400, '아직 요약된 정보가 없습니다.');

	try {
		const { waitUntil } = await import('cloudflare:workers');
		waitUntil(
			generateTtsAudioInternal(summaryId, speechText).catch((err) => {
				console.error('[TTS] Background processing failed:', err);
			})
		);
	} catch {
		generateTtsAudioInternal(summaryId, speechText).catch((err) => {
			console.error('[TTS] Background processing failed:', err);
		});
	}
}

export const generateTtsAudio = command(GenerateTtsCommandSchema, runGenerateTts);

export const generateTTS = form(GenerateTtsFormSchema, async ({ summaryId }) =>
	runGenerateTts({ summaryId })
);
