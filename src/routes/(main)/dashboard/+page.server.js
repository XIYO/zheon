import { summarizeTranscript } from '$lib/server/summary.js';
import { extractSubtitle } from '$lib/server/pyExtractSubtitle.js';
import { fail, redirect } from '@sveltejs/kit';

export const prerender = false;

export const load = async ({ locals: { supabase, user } }) => {
	if (!user) return { summaries: [] };
	const { data: summaries, error } = await supabase
		.from('summary')
		.select('id, youtube_url, title, summary, user_id')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Load error:', error);
	}

	return {
		summaries
	};
}

export const actions = {
	default: async ({ url, request, locals: { supabase, user } }) => {
		if (!user) {
			const currentPath = url.pathname + url.search;
			throw redirect(303, `/auth/sign-in/?redirectTo=${encodeURIComponent(currentPath)}`);
		}
		
		const formData = await request.formData();
		const youtubeUrl = formData.get('youtubeUrl');
		let lang = formData.get('lang') ?? 'ko';
		if (lang !== 'ko' && lang !== 'en') lang = 'ko';
		if (!youtubeUrl || typeof youtubeUrl !== 'string') return fail(400, { error: '유튜브 URL이 필요합니다.' });

		// check if already exists in DB
		const { data: existing, error: fetchError } = await supabase
			.from('summary')
			.select('id, youtube_url, title, summary, user_id')
			.eq('youtube_url', youtubeUrl)
			.eq('lang', lang)
			.eq('user_id', user.id)
			.maybeSingle();

		if (fetchError) {
			console.error('Fetch error:', fetchError);
		}

		const subtitle = await extractSubtitle(youtubeUrl);
		if (!subtitle || typeof subtitle !== 'string') {
			return fail(400, {
				message: 'Failed to extract subtitle. Please check the YouTube URL.'
			});
		}
		/** @type {'ko' | 'en'} */
		let safeLang = lang === 'en' ? 'en' : 'ko';
		const { title, summary, content } = await summarizeTranscript(subtitle, { lang: safeLang });

		let insertedData;
		if (existing) {
			// 이미 있으면 업데이트
			const { data: updated, error: updateError } = await supabase
				.from('summary')
				.update({ title, summary, content })
				.eq('id', existing.id)
				.select()
				.single();
			if (updateError) {
				console.error('Update error:', updateError);
				return fail(500, { error: 'Failed to update summary' });
			}
			insertedData = updated;
		} else {
			// 없으면 새로 생성
			const { data: inserted, error: insertError } = await supabase
				.from('summary')
				.insert({ youtube_url: youtubeUrl, lang, title, summary, content, user_id: user.id })
				.select()
				.single();
			if (insertError) {
				console.error('Insert error:', insertError);
				return fail(500, { error: 'Failed to create summary' });
			}
			insertedData = inserted;
		}

		return {
			summary: insertedData
		};
	}
};
