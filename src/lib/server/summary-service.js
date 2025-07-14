/**
 * 요약 관련 서비스 함수들
 */

/**
 * 기존 요약이 있는지 확인합니다
 * @param {string} youtubeUrl - YouTube URL
 * @param {string} lang - 언어 코드
 * @param {string} userId - 사용자 ID
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Promise<object | null>} - 기존 요약 또는 null
 */
export async function getExistingSummary(youtubeUrl, lang, userId, supabase) {
	try {
		const { data: existing, error } = await supabase
			.from('summary')
			.select('id, youtube_url, title, summary, user_id')
			.eq('youtube_url', youtubeUrl)
			.eq('lang', lang)
			.eq('user_id', userId)
			.maybeSingle();

		if (error) {
			console.error('Fetch existing summary error:', error);
			return null;
		}

		return existing;
	} catch (error) {
		console.error('Error getting existing summary:', error);
		return null;
	}
}

/**
 * 기존 요약을 업데이트합니다
 * @param {number} summaryId - 요약 ID
 * @param {string} title - 제목
 * @param {string} summary - 요약
 * @param {string} content - 내용
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Promise<object>} - 업데이트된 요약
 * @throws {Error} - 업데이트 실패 시
 */
export async function updateSummary(summaryId, title, summary, content, supabase) {
	const { data: updated, error } = await supabase
		.from('summary')
		.update({ title, summary, content })
		.eq('id', summaryId)
		.select()
		.single();

	if (error) {
		console.error('Update error:', error);
		throw new Error('Failed to update summary');
	}

	return updated;
}

/**
 * 새 요약을 생성합니다
 * @param {string} youtubeUrl - YouTube URL
 * @param {string} lang - 언어 코드
 * @param {string} title - 제목
 * @param {string} summary - 요약
 * @param {string} content - 내용
 * @param {string} userId - 사용자 ID
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Promise<object>} - 생성된 요약
 * @throws {Error} - 생성 실패 시
 */
export async function createSummary(youtubeUrl, lang, title, summary, content, userId, supabase) {
	const { data: inserted, error } = await supabase
		.from('summary')
		.insert({
			youtube_url: youtubeUrl,
			lang,
			title,
			summary,
			content,
			user_id: userId
		})
		.select()
		.single();

	if (error) {
		console.error('Insert error:', error);
		throw new Error('Failed to create summary');
	}

	return inserted;
}

/**
 * 요약을 생성하거나 업데이트합니다
 * @param {string} youtubeUrl - YouTube URL
 * @param {string} lang - 언어 코드
 * @param {string} title - 제목
 * @param {string} summary - 요약
 * @param {string} content - 내용
 * @param {string} userId - 사용자 ID
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Promise<object>} - 최종 요약 데이터
 */
export async function upsertSummary(youtubeUrl, lang, title, summary, content, userId, supabase) {
	// 기존 요약 확인
	const existing = await getExistingSummary(youtubeUrl, lang, userId, supabase);

	if (existing) {
		// 업데이트
		return await updateSummary(existing.id, title, summary, content, supabase);
	} else {
		// 새로 생성
		return await createSummary(youtubeUrl, lang, title, summary, content, userId, supabase);
	}
}
