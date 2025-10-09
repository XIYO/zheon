/**
 * Pending 레코드 생성 Runnable
 * 입력: { url: string }
 * 출력: 입력 데이터 + { record_id: string, record_created: boolean }
 */

import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { createSupabaseClient } from '../supabase-client.ts';

export const createPendingRecord = RunnableLambda.from(async (input: { url: string }) => {
	console.log(`[PendingRecord] Creating pending record for: ${input.url}`);

	const supabase = createSupabaseClient();

	try {
		// summary 테이블에 pending 상태로 레코드 생성
		const { data, error } = await supabase
			.from('summary')
			.insert({
				url: input.url,
				title: '정리 중...', // 임시 제목
				summary: '영상을 분석하고 있습니다', // 임시 요약
				content: '', // 빈 콘텐츠
				lang: 'ko',
				processing_status: 'pending',
				created_at: new Date().toISOString()
			})
			.select()
			.single();

		if (error) {
			// 중복 URL 에러인 경우 (unique constraint violation)
			if (error.code === '23505') {
				console.log(`[PendingRecord] ⚠️  Record already exists for URL: ${input.url}`);

				// 기존 레코드 조회
				const { data: existing, error: fetchError } = await supabase
					.from('summary')
					.select('*')
					.eq('url', input.url)
					.single();

				if (fetchError || !existing) {
					throw new Error(`Failed to fetch existing record: ${fetchError?.message}`);
				}

				// 기존 레코드 상태 확인
				const status = existing.processing_status;

				if (status === 'completed') {
					console.log(`[PendingRecord] ✅ Using existing completed record: ${existing.id}`);
					return {
						...input,
						record_id: existing.id,
						record_created: false,
						existing_status: status,
						_skip_processing: true, // 파이프라인 스킵 플래그
						_existing_record: existing
					};
				}

				if (status === 'pending' || status === 'processing') {
					console.log(
						`[PendingRecord] ⏳ Record is already ${status}, continuing with existing: ${existing.id}`
					);
					return {
						...input,
						record_id: existing.id,
						record_created: false,
						existing_status: status
					};
				}

				if (status === 'failed') {
					console.log(`[PendingRecord] 🔄 Retrying failed record: ${existing.id}`);

					// failed 상태를 pending으로 재설정
					const { error: updateError } = await supabase
						.from('summary')
						.update({
							processing_status: 'pending',
							updated_at: new Date().toISOString()
						})
						.eq('id', existing.id);

					if (updateError) {
						throw new Error(`Failed to update failed record: ${updateError.message}`);
					}

					return {
						...input,
						record_id: existing.id,
						record_created: false,
						existing_status: 'retry_from_failed'
					};
				}
			}

			throw new Error(`Database error: ${error.message}`);
		}

		console.log(`[PendingRecord] ✅ Created pending record: ${data.id}`);

		return {
			...input,
			record_id: data.id,
			record_created: true
		};
	} catch (error) {
		console.error(`[PendingRecord] ❌ Error:`, error);
		throw error;
	}
});
