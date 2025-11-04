import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

/**
 * Command: 오디오 Signed URL 생성
 * - Summary ID로 storage path 조회
 * - 60초 유효한 signed URL 생성 (1회용 효과)
 * - OPFS 캐싱과 함께 사용
 */
export const getAudioSignedUrl = command(
	v.object({
		summaryId: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ summaryId }) => {
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		// 1. DB에서 storage path 조회
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

		// 2. Signed URL 생성 (60초 유효)
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
