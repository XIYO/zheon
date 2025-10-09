/**
 * YouTube 자막 추출 Runnable
 * 입력: { url: string }
 * 출력: { url: string, transcript: string, transcript_length: number, cached: boolean }
 */

import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { extractYouTubeSubtitles } from '../youtube-extractor.ts';

export const extractSubtitles = RunnableLambda.from(
	async (input: { url: string; _skip_save?: boolean; _existing_record?: any }) => {
		// 중복 체크에서 스킵 플래그가 설정된 경우
		if (input._skip_save) {
			console.log(`[Extract] ⏭️ Skipping extraction - using existing record`);
			// 기존 레코드 정보를 그대로 전달
			return {
				...input,
				transcript: 'CACHED',
				transcript_length: 0,
				cached: true
			};
		}

		console.log(`[Extract] Processing: ${input.url}`);

		const result = await extractYouTubeSubtitles(input.url);

		if (!result.success) {
			throw new Error(result.error || 'Subtitle extraction failed');
		}

		// 다음 파이프라인으로 전달할 데이터 (입력 데이터 보존)
		return {
			...input, // record_id 등 입력 데이터 모두 보존
			transcript: result.transcript!,
			transcript_length: result.transcript?.length || 0,
			cached: result.cached || false
		};
	}
);
