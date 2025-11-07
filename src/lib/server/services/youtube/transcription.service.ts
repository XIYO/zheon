import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { error } from '@sveltejs/kit';
import { YTNodes, type Innertube } from 'youtubei.js';

export interface TranscriptSegmentData {
	start_ms: number;
	end_ms: number;
	text: string;
}

export interface TranscriptData {
	title?: string;
	duration?: number;
	segments: TranscriptSegmentData[];
}

export interface CollectTranscriptOptions {
	force?: boolean;
}

export class TranscriptionService {
	constructor(
		private supabase: SupabaseClient<Database>,
		private youtube: Innertube
	) {}

	async collectTranscript(videoId: string, options: CollectTranscriptOptions = {}): Promise<void> {
		const { force = false } = options;
		console.log(`[transcript] 수집 시작 videoId=${videoId} force=${force}`);

		if (!force) {
			const existing = await this.checkExisting(videoId);
			if (existing) {
				console.log(`[transcript] 이미 존재 videoId=${videoId}`);
				return;
			}
		}

		const transcriptData = await this.fetchFromYouTube(videoId);
		if (!transcriptData) {
			console.log(`[transcript] 자막 없음 videoId=${videoId}`);
			throw error(404, '자막을 사용할 수 없습니다');
		}

		await this.saveTranscript(videoId, transcriptData);

		console.log(
			`[transcript] 저장 완료 videoId=${videoId} segments=${transcriptData.segments.length}개`
		);
	}

	async getTranscriptFromDB(videoId: string) {
		console.log(`[transcript] DB 조회 시작 videoId=${videoId}`);

		const { data: transcript, error: fetchError } = await this.supabase
			.from('transcripts')
			.select('id, video_id, data, updated_at')
			.eq('video_id', videoId)
			.maybeSingle();

		if (fetchError) {
			throw error(500, `자막 조회 실패: ${fetchError.message}`);
		}

		const segments = (transcript?.data as any)?.segments || [];
		console.log(`[transcript] DB 조회 완료 videoId=${videoId} segments=${segments.length}개`);

		return transcript;
	}

	private async checkExisting(videoId: string) {
		const { data: existing, error: checkError } = await this.supabase
			.from('transcripts')
			.select('id, data')
			.eq('video_id', videoId)
			.maybeSingle();

		if (checkError) {
			throw error(500, `자막 확인 실패: ${checkError.message}`);
		}

		return existing;
	}

	private async fetchFromYouTube(videoId: string): Promise<TranscriptData | null> {
		try {
			const info = await this.youtube.getInfo(videoId);
			const transcript = await info.getTranscript();

			if (!transcript?.transcript?.content?.body?.initial_segments) {
				return null;
			}

			const segments = transcript.transcript.content.body
				.initial_segments as YTNodes.TranscriptSegment[];
			return {
				title: info.basic_info?.title,
				duration: info.basic_info?.duration,
				segments: segments.map((segment) => ({
					start_ms: parseInt(segment.start_ms),
					end_ms: parseInt(segment.end_ms),
					text: segment.snippet.text || ''
				}))
			};
		} catch (err) {
			console.error(`[transcript] YouTube API 에러 videoId=${videoId}:`, err);
			return null;
		}
	}

	private async saveTranscript(videoId: string, transcriptData: TranscriptData): Promise<void> {
		const { error: insertError } = await this.supabase.from('transcripts').upsert(
			{
				video_id: videoId,
				data: transcriptData as any
			},
			{
				onConflict: 'video_id'
			}
		);

		if (insertError) {
			console.error(`[transcript] 저장 실패:`, insertError);
			throw error(500, `자막 저장 실패: ${insertError.message}`);
		}
	}
}
