/**
 * 데이터베이스 저장 Runnable
 * 입력: { youtube_url: string, transcript: string, summary: string, ... }
 * 출력: { record_id: string } (최종 결과)
 */

import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { createSupabaseClient } from '../supabase-client.ts';

export const saveToDB = RunnableLambda.from(
	async (input: {
		url: string;
		transcript: string;
		summary: string;
		insights?: string;
		summary_method: string;
		title?: string;
		_skip_save?: boolean;
		_existing_record?: any;
	}) => {
		console.log(`[Save] Storing to database...`);

		// 중복 레코드가 이미 업데이트되었으면 저장 스킵
		if (input._skip_save && input._existing_record) {
			console.log(
				`[Save] ✅ Skipping save - existing summary record updated (ID: ${input._existing_record.id})`
			);
			return {
				record_id: input._existing_record.id,
				saved_at: new Date().toISOString(), // 업데이트된 시간
				was_duplicate: true
			};
		}

		const supabase = createSupabaseClient();

		// 두 테이블에 모두 저장 (subtitles와 summary)

		// 1. subtitles 테이블에 저장 - 백엔드에서 처리하므로 주석 처리
		/*
    const { data: subtitleData, error: subtitleError } = await supabase
      .from("subtitles")
      .insert({
        url: input.url, // url 컬럼 사용
        subtitle: input.transcript,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (subtitleError) {
      throw new Error(`Subtitles save error: ${subtitleError.message}`);
    }
    */

		// 2. summary 테이블에 저장 (Service Role Key 사용, owners 없이 저장)
		const { data: summaryData, error: summaryError } = await supabase
			.from('summary')
			.insert({
				url: input.url,
				title: input.title || 'YouTube Video Summary',
				summary: input.summary,
				content: input.insights || input.summary, // 인사이트가 있으면 인사이트, 없으면 요약 저장
				lang: 'ko', // 기본 언어 설정
				created_at: new Date().toISOString()
			})
			.select()
			.single();

		if (summaryError) {
			throw new Error(`Summary save error: ${summaryError.message}`);
		}

		console.log(`[Save] ✅ Saved new summary record - ID: ${summaryData.id}`);
		// 기존: console.log(`[Save] ✅ Saved new records - Subtitle ID: ${subtitleData.id}, Summary ID: ${summaryData.id}`);

		// 최종 결과 (summary 테이블 기준)
		return {
			record_id: summaryData.id,
			saved_at: summaryData.created_at,
			was_duplicate: false
		};
	}
);
