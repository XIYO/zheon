import { error } from '@sveltejs/kit';

export async function analyzeVideoBackground(
	videoId,
	maxComments,
	supabase,
	adminSupabase,
	collectTranscript,
	collectComments,
	analyzeAndSummarizeVideo,
	getVideoInfo
) {
	console.log(`[Summaries] 영상 분석 시작 videoId=${videoId}`);

	const { data: existing } = await supabase
		.from('summaries')
		.select('id, analysis_status')
		.eq('url', `https://www.youtube.com/watch?v=${videoId}`)
		.maybeSingle();

	let summaryId = existing?.id;

	await adminSupabase
		.from('summaries')
		.update({
			analysis_status: 'processing',
			processing_status: 'processing'
		})
		.eq('id', summaryId || existing?.id);

	console.log(`[Summaries] 1단계: 영상 정보/자막/댓글 병렬 수집 시작`);
	const [videoInfo, transcriptResult, commentsResult] = await Promise.all([
		getVideoInfo({ videoId }),
		collectTranscript({ videoId }),
		collectComments({ videoId, maxComments })
	]);

	const title = videoInfo.title;
	const thumbnailUrl = videoInfo.thumbnail_url;

	if (!summaryId) {
		const { data: created, error: createError } = await adminSupabase
			.from('summaries')
			.insert({
				url: `https://www.youtube.com/watch?v=${videoId}`,
				title,
				thumbnail_url: thumbnailUrl,
				processing_status: 'processing',
				analysis_status: 'processing'
			})
			.select('id')
			.single();

		if (createError) throw error(500, `요약 레코드 생성 실패: ${createError.message}`);
		summaryId = created.id;
		console.log(`[Summaries] 요약 레코드 생성 summaryId=${summaryId}, title=${title}`);
	} else {
		console.log(`[Summaries] 기존 요약 사용 summaryId=${summaryId}`);

		await adminSupabase
			.from('summaries')
			.update({
				title,
				thumbnail_url: thumbnailUrl
			})
			.eq('id', summaryId);
	}

	if (!transcriptResult.success || !transcriptResult.data) {
		throw error(400, '자막을 사용할 수 없습니다');
	}

	if (!commentsResult.success) {
		throw error(400, '댓글을 수집할 수 없습니다');
	}

	console.log(
		`[Summaries] 수집 완료 - 자막: ${transcriptResult.data.segments?.length || 0}개, 댓글: ${commentsResult.collected}개`
	);

	const transcript = transcriptResult.data.segments
		.map((seg) => seg.text || '')
		.join(' ')
		.trim();

	const { data: commentRecords, error: commentError } = await supabase
		.from('comments')
		.select('data')
		.eq('video_id', videoId)
		.order('updated_at', { ascending: false })
		.limit(100);

	if (commentError) {
		throw error(500, `댓글 조회 실패: ${commentError.message}`);
	}

	const comments = commentRecords
		.map((record) => {
			const commentData = record.data;
			return commentData?.content?.text || commentData?.text || '';
		})
		.filter((text) => text.length > 0);

	console.log(`[Summaries] 2단계: AI 요약 + 분석 시작`);
	const result = await analyzeAndSummarizeVideo({
		videoId,
		transcript,
		comments
	});

	if (!result.success) {
		throw error(500, 'AI 분석 실패');
	}

	const { summary, content_quality, sentiment, community, age_groups, insights, total_comments_analyzed } =
		result;

	console.log(`[Summaries] 3단계: DB 저장 시작`);
	const { error: updateError } = await adminSupabase
		.from('summaries')
		.update({
			transcript,
			summary,
			processing_status: 'completed',

			content_quality_score: content_quality.overall_score,
			content_educational_value: content_quality.educational_value,
			content_entertainment_value: content_quality.entertainment_value,
			content_information_accuracy: content_quality.information_accuracy,
			content_clarity: content_quality.clarity,
			content_depth: content_quality.depth,
			content_category: content_quality.category,
			content_target_audience: content_quality.target_audience,

			sentiment_overall_score: sentiment.overall_score,
			sentiment_positive_ratio: sentiment.positive_ratio,
			sentiment_neutral_ratio: sentiment.neutral_ratio,
			sentiment_negative_ratio: sentiment.negative_ratio,
			sentiment_intensity: sentiment.intensity,

			community_quality_score: community.overall_score,
			community_politeness: community.politeness,
			community_rudeness: community.rudeness,
			community_kindness: community.kindness,
			community_toxicity: community.toxicity,
			community_constructive: community.constructive,
			community_self_centered: community.self_centered,
			community_off_topic: community.off_topic,

			age_group_teens: age_groups.teens,
			age_group_20s: age_groups.twenties,
			age_group_30s: age_groups.thirties,
			age_group_40plus: age_groups.forty_plus,

			ai_content_summary: insights.content_summary,
			ai_audience_reaction: insights.audience_reaction,
			ai_key_insights: insights.key_insights,
			ai_recommendations: insights.recommendations,

			total_comments_analyzed,
			analysis_status: 'completed',
			analyzed_at: new Date().toISOString(),
			analysis_model: 'gemini-2.0-flash-exp',
			updated_at: new Date().toISOString()
		})
		.eq('id', summaryId);

	if (updateError) {
		throw error(500, `분석 결과 저장 실패: ${updateError.message}`);
	}

	console.log(`[Summaries] 완료 summaryId=${summaryId}`);

	return {
		success: true,
		summaryId,
		videoId,
		summary,
		transcript_segments: transcriptResult.data.segments.length,
		comments_collected: commentsResult.collected,
		comments_analyzed: total_comments_analyzed,
		scores: {
			content_quality: content_quality.overall_score,
			sentiment: sentiment.overall_score,
			community_quality: community.overall_score
		}
	};
}
