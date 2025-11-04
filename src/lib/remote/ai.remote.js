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
import { VIDEO_ANALYSIS_PROMPT_TEMPLATE } from '$lib/remote/video-analysis-prompt.js';

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

/**
 * Valibot 스키마 정의 - 영상 품질 분석 출력
 * AI SDK용: check() 제외 (JSON Schema 변환 불가)
 */
const VideoAnalysisSchema = valibotSchema(
	v.object({
		content_quality: v.object({
			educational_value: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			entertainment_value: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			information_accuracy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			clarity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			depth: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			category: v.pipe(v.string(), v.minLength(1)),
			target_audience: v.pipe(v.string(), v.minLength(1))
		}),
		sentiment: v.object({
			positive_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			neutral_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			negative_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			intensity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		community: v.object({
			politeness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			rudeness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			kindness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			toxicity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			constructive: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			self_centered: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			off_topic: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		age_groups: v.object({
			teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		summary: v.object({
			content_summary: v.pipe(v.string(), v.minLength(50), v.maxLength(500)),
			audience_reaction: v.pipe(v.string(), v.minLength(50), v.maxLength(500)),
			key_insights: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(5)),
			recommendations: v.pipe(v.array(v.string()), v.minLength(0), v.maxLength(3))
		})
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
		.from('summaries')
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

/**
 * Command: 영상 품질 분석
 * 자막 + 댓글 100개를 분석하여 영상과 커뮤니티 품질 평가
 */
export const analyzeVideoQuality = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1), v.trim()),
		summaryId: v.optional(v.pipe(v.string(), v.minLength(1)))
	}),
	async ({ videoId, summaryId }) => {
		const geminiApiKey = env.GEMINI_API_KEY;
		if (!geminiApiKey) throw error(500, 'GEMINI_API_KEY가 설정되지 않았습니다');

		const { locals } = getRequestEvent();
		const { supabase } = locals;

		try {
			console.log('[VideoAnalysis] 분석 시작 videoId=' + videoId);

			let transcript = '';
			let targetSummaryId = summaryId;

			if (summaryId) {
				const { data: summaryRecord, error: summaryError } = await supabase
					.from('summaries')
					.select('transcript')
					.eq('id', summaryId)
					.single();

				if (summaryError) throw error(404, '요약 정보를 찾을 수 없습니다: ' + summaryError.message);
				transcript = summaryRecord.transcript || '';
			} else {
				const { data: transcriptRecord, error: transcriptError } = await supabase
					.from('transcripts')
					.select('data')
					.eq('video_id', videoId)
					.single();

				if (transcriptError && transcriptError.code !== 'PGRST116') {
					throw error(500, '자막 조회 실패: ' + transcriptError.message);
				}

				if (transcriptRecord?.data?.segments) {
					transcript = transcriptRecord.data.segments
						.map(seg => seg.text || '')
						.join(' ')
						.trim();
				}
			}

			if (!transcript) {
				throw error(400, '자막이 없습니다. 먼저 자막을 수집해주세요.');
			}

			const { data: commentRecords, error: commentError } = await supabase
				.from('comments')
				.select('data')
				.eq('video_id', videoId)
				.order('updated_at', { ascending: false })
				.limit(100);

			if (commentError) {
				throw error(500, '댓글 조회 실패: ' + commentError.message);
			}

			if (!commentRecords || commentRecords.length === 0) {
				throw error(400, '댓글이 없습니다. 먼저 댓글을 수집해주세요.');
			}

			const comments = commentRecords
				.map(record => {
					const commentData = record.data;
					return commentData?.content?.text || commentData?.text || '';
				})
				.filter(text => text.length > 0);

			console.log('[VideoAnalysis] 자막 길이: ' + transcript.length + '자, 댓글: ' + comments.length + '개');

			if (!targetSummaryId) {
				const { data: existingSummary, error: existingError } = await supabase
					.from('summaries')
					.select('id')
					.eq('url', 'https://www.youtube.com/watch?v=' + videoId)
					.maybeSingle();

				if (existingError && existingError.code !== 'PGRST116') {
					throw error(500, '기존 요약 조회 실패: ' + existingError.message);
				}

				if (existingSummary) {
					targetSummaryId = existingSummary.id;
				} else {
					const { data: newSummary, error: insertError } = await supabase
						.from('summaries')
						.insert({
							url: 'https://www.youtube.com/watch?v=' + videoId,
							transcript,
							processing_status: 'pending'
						})
						.select('id')
						.single();

					if (insertError) throw error(500, '요약 레코드 생성 실패: ' + insertError.message);
					targetSummaryId = newSummary.id;
				}
			}

			await supabase
				.from('summaries')
				.update({ analysis_status: 'processing' })
				.eq('id', targetSummaryId);

			const prompt = VIDEO_ANALYSIS_PROMPT_TEMPLATE
				.replace('{transcript}', transcript)
				.replace('{comments}', comments.map((c, i) => (i + 1) + '. ' + c).join('\n'));

			const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
			const model = google('gemini-2.0-flash-exp');

			console.log('[VideoAnalysis] Gemini API 호출 중...');

			const result = await generateObject({
				model,
				schema: VideoAnalysisSchema,
				temperature: 0.3,
				prompt
			});

			const analysis = result.object;

			console.log('[VideoAnalysis] AI 분석 완료');

			const sentimentSum = analysis.sentiment.positive_ratio + analysis.sentiment.neutral_ratio + analysis.sentiment.negative_ratio;
			const ageGroupSum = analysis.age_groups.teens + analysis.age_groups.twenties + analysis.age_groups.thirties + analysis.age_groups.forty_plus;

			if (sentimentSum !== 100) {
				console.warn(`[VideoAnalysis] 감정 비율 합계가 100이 아님: ${sentimentSum}, 자동 조정 중...`);
				const scale = 100 / sentimentSum;
				analysis.sentiment.positive_ratio = Math.round(analysis.sentiment.positive_ratio * scale);
				analysis.sentiment.neutral_ratio = Math.round(analysis.sentiment.neutral_ratio * scale);
				analysis.sentiment.negative_ratio = 100 - analysis.sentiment.positive_ratio - analysis.sentiment.neutral_ratio;
			}

			if (ageGroupSum !== 100) {
				console.warn(`[VideoAnalysis] 나이대 비율 합계가 100이 아님: ${ageGroupSum}, 자동 조정 중...`);
				const scale = 100 / ageGroupSum;
				analysis.age_groups.teens = Math.round(analysis.age_groups.teens * scale);
				analysis.age_groups.twenties = Math.round(analysis.age_groups.twenties * scale);
				analysis.age_groups.thirties = Math.round(analysis.age_groups.thirties * scale);
				analysis.age_groups.forty_plus = 100 - analysis.age_groups.teens - analysis.age_groups.twenties - analysis.age_groups.thirties;
			}

			const { error: updateError } = await supabase
				.from('summaries')
				.update({
					content_quality_score: analysis.content_quality.overall_score,
					content_educational_value: analysis.content_quality.educational_value,
					content_entertainment_value: analysis.content_quality.entertainment_value,
					content_information_accuracy: analysis.content_quality.information_accuracy,
					content_clarity: analysis.content_quality.clarity,
					content_depth: analysis.content_quality.depth,
					content_category: analysis.content_quality.category,
					content_target_audience: analysis.content_quality.target_audience,

					sentiment_overall_score: analysis.sentiment.overall_score,
					sentiment_positive_ratio: analysis.sentiment.positive_ratio,
					sentiment_neutral_ratio: analysis.sentiment.neutral_ratio,
					sentiment_negative_ratio: analysis.sentiment.negative_ratio,
					sentiment_intensity: analysis.sentiment.intensity,

					community_quality_score: analysis.community.overall_score,
					community_politeness: analysis.community.politeness,
					community_rudeness: analysis.community.rudeness,
					community_kindness: analysis.community.kindness,
					community_toxicity: analysis.community.toxicity,
					community_constructive: analysis.community.constructive,
					community_self_centered: analysis.community.self_centered,
					community_off_topic: analysis.community.off_topic,

					age_group_teens: analysis.age_groups.teens,
					age_group_20s: analysis.age_groups.twenties,
					age_group_30s: analysis.age_groups.thirties,
					age_group_40plus: analysis.age_groups.forty_plus,

					ai_content_summary: analysis.summary.content_summary,
					ai_audience_reaction: analysis.summary.audience_reaction,
					ai_key_insights: analysis.summary.key_insights,
					ai_recommendations: analysis.summary.recommendations,

					total_comments_analyzed: comments.length,
					analysis_status: 'completed',
					analyzed_at: new Date().toISOString(),
					analysis_model: 'gemini-2.0-flash-exp'
				})
				.eq('id', targetSummaryId);

			if (updateError) {
				throw error(500, '분석 결과 저장 실패: ' + updateError.message);
			}

			console.log('[VideoAnalysis] 분석 완료 및 저장 성공 summaryId=' + targetSummaryId);

			return {
				success: true,
				summaryId: targetSummaryId,
				videoId,
				analysis
			};
		} catch (err) {
			console.error('[VideoAnalysis] 분석 실패:', err);

			if (summaryId) {
				await supabase
					.from('summaries')
					.update({ analysis_status: 'failed' })
					.eq('id', summaryId)
					.then(() => {}).catch(console.error);
			}

			const errorMessage = err instanceof Error ? err.message : String(err);

			if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
				throw error(429, 'API 할당량 초과. 나중에 다시 시도해주세요.');
			}

			if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
				throw error(500, 'AI 출력 검증 실패. 다시 시도해주세요.');
			}

			throw error(500, '영상 품질 분석 실패: ' + errorMessage);
		}
	}
);
