import { query, form, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	SummarySchema,
	GetSummariesSchema,
	GetSummaryByIdSchema
} from '$lib/remote/summary.schema';
import { SummaryService } from '$lib/server/services/summary.service';

export const getSummaries = query(
	GetSummariesSchema,
	async ({ cursor, limit, sortBy, direction }) => {
		const { locals } = getRequestEvent();
		const { supabase } = locals;

		const ascending = sortBy === 'oldest'; // 수파베이스는 정렬을 불린 사용
		const isUnlimited = limit === 0;

		// 데이터가 클라이언트에 전달되기 때문에 최대한 가볍게 만들어야한다.
		let queryBuilder = supabase
			.from('summaries')
			.select('id, title, video_id, processing_status, created_at');

		queryBuilder =
			direction === 'after'
				? queryBuilder.gt('created_at', cursor)
				: queryBuilder.lt('created_at', cursor);

		queryBuilder = queryBuilder.order('created_at', { ascending });

		if (!isUnlimited) {
			queryBuilder = queryBuilder.limit(limit + 1);
		}

		const { data, error: sbError } = await queryBuilder;

		if (sbError) throw error(500, sbError.message);

		const hasMore = !isUnlimited && data.length > limit;
		const summaries = hasMore ? data.slice(0, limit) : data;

		return {
			summaries,
			nextCursor: hasMore ? summaries[summaries.length - 1]?.created_at : undefined
		};
	}
);

export const getSummaryById = query(GetSummaryByIdSchema, async ({ id }) => {
	console.log('[remote/getSummaryById] called', { videoId: id });
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('summaries')
		.select('*')
		.eq('video_id', id)
		.single();

	if (sbError) {
		console.error('[remote/getSummaryById] supabase error', { videoId: id, message: sbError.message });
		throw error(404, 'Summary not found');
	}
	if (!data) {
		console.warn('[remote/getSummaryById] no data returned', { videoId: id });
		throw error(404, 'Summary not found');
	}

	console.log('[remote/getSummaryById] success', {
		id: data.id,
		video_id: data.video_id,
		analysis_status: data.analysis_status,
		summary_audio_status: data.summary_audio_status
	});

	const [
		{ data: community, error: cmError },
		{ data: categoryData, error: catError },
		{ data: tagData, error: tagError },
		{ data: metricsData, error: metricsError }
	] = await Promise.all([
		supabase.from('content_community_metrics').select('*').eq('video_id', id).maybeSingle(),
		supabase
			.from('video_categories')
			.select('categories(slug, name, name_ko, description)')
			.eq('video_id', id)
			.order('priority', { ascending: true }),
		supabase
			.from('video_tags')
			.select('tags(slug, name, name_ko), weight')
			.eq('video_id', id)
			.order('weight', { ascending: false }),
		supabase.from('content_metrics').select('metrics').eq('video_id', id).maybeSingle()
	]);

	if (cmError) {
		console.warn('[remote/getSummaryById] community metrics fetch error', cmError.message);
	}
	if (catError) {
		console.warn('[remote/getSummaryById] categories fetch error', catError.message);
	}
	if (tagError) {
		console.warn('[remote/getSummaryById] tags fetch error', tagError.message);
	}
	if (metricsError) {
		console.warn('[remote/getSummaryById] metrics fetch error', metricsError.message);
	}

	const categories = (categoryData || []).map((item) => item.categories).filter(Boolean);
	const tags = (tagData || [])
		.map((item) => ({ ...item.tags, weight: item.weight }))
		.filter((tag) => tag.slug);
	const metrics = metricsData?.metrics || {};

	return { ...data, community, categories, tags, metrics };
});

export const createSummary = form(SummarySchema, async ({ video_id }) => {
	console.log('[createSummary] 호출됨:', { video_id });
	const { locals } = getRequestEvent();
	const { supabase, adminSupabase } = locals;

	const { data: existing, error: selectError } = await supabase
		.from('summaries')
		.select('id, analysis_status')
		.eq('video_id', video_id)
		.maybeSingle();

	if (selectError) throw error(500, selectError);

	if (existing) {
		console.log(`[createSummary] 기존 레코드, status=${existing.analysis_status}`);

		if (existing.analysis_status === 'completed' || existing.analysis_status === 'processing') {
			return;
		}

		// 거르고 걸러서, 결국 페일 상태만 업데이트 된다.
		await adminSupabase
			.from('summaries')
			.update({
				processing_status: 'processing',
				analysis_status: 'processing',
				updated_at: new Date().toISOString()
			})
			.eq('video_id', video_id);
	} else {
		// 실제 신규, 처리 시작할거라고 미리 넣는다.
		console.log('[createSummary] INSERT 시도:', { video_id });
		const { error: insertError } = await supabase.from('summaries').insert({
			video_id,
			processing_status: 'processing',
			analysis_status: 'processing'
		});
		// 인서트 실패가 뜨면 바로 종료 하면된다. 인서트 실패의 이유는 동시 요청으로 들어올경우 먼저들어온것만 다음단계를 진행하면된다.
		if (insertError) return;
	}

	const summaryService = new SummaryService(adminSupabase, locals.youtube);
	summaryService
		.analyzeSummary(video_id, {
			maxBatches: 5,
			force: false,
			geminiApiKey: env.GEMINI_API_KEY
		})
		.catch(async (err) => {
			console.error('[createSummary] 백그라운드 분석 실패:', err);
			await adminSupabase
				.from('summaries')
				.update({
					analysis_status: 'failed',
					processing_status: 'failed',
					updated_at: new Date().toISOString()
				})
				.eq('video_id', video_id);
		});
});
