export async function loadUnanalyzedComments(supabase, videoId) {
	const { data, error } = await supabase
		.from('youtube_comments')
		.select('*')
		.eq('video_id', videoId)
		.is('sentiment', null)
		.order('collected_at', { ascending: false });

	if (error) throw new Error(`Failed to load comments: ${error.message}`);
	return data || [];
}

export async function loadAllAnalyzedComments(supabase, videoId) {
	const { data, error } = await supabase
		.from('youtube_comments')
		.select('sentiment')
		.eq('video_id', videoId)
		.not('sentiment', 'is', null);

	if (error) throw new Error(`Failed to load analyzed comments: ${error.message}`);
	return data || [];
}

export async function storeAnalysisResults(supabase, results) {
	if (results.length === 0) return;

	const now = new Date().toISOString();
	const updateData = results.map((r) => ({
		comment_id: r.comment_id,
		sentiment: r.sentiment,
		sentiment_confidence: r.confidence,
		sentiment_analyzed_at: now,
		updated_at: now
	}));

	const { error } = await supabase
		.from('youtube_comments')
		.upsert(updateData, { onConflict: 'comment_id' });

	if (error) throw new Error(`Failed to store results: ${error.message}`);
}

export async function storeSentimentHistory(supabase, videoId, emotionScore) {
	const { error } = await supabase
		.from('video_analysis_history')
		.insert({
			video_id: videoId,
			emotion_score: emotionScore.emotion_score,
			sentiment_distribution: emotionScore.distribution,
			total_comments_analyzed: emotionScore.total_comments,
			daily_change: emotionScore.daily_change,
			created_at: new Date().toISOString()
		});

	if (error && error.code !== '42P01') {
		console.warn(`Warning storing history: ${error.message}`);
	}
}

export function calculateDistribution(comments) {
	const counts = {
		positive: 0,
		neutral: 0,
		negative: 0
	};

	for (const comment of comments) {
		if (comment.sentiment === 'positive') counts.positive++;
		else if (comment.sentiment === 'neutral') counts.neutral++;
		else if (comment.sentiment === 'negative') counts.negative++;
	}

	const total = comments.length;
	return {
		positive: (counts.positive / total) * 100,
		neutral: (counts.neutral / total) * 100,
		negative: (counts.negative / total) * 100
	};
}

export async function getPreviousEmotionScore(supabase, videoId) {
	const { data, error } = await supabase
		.from('video_analysis_history')
		.select('emotion_score')
		.eq('video_id', videoId)
		.order('created_at', { ascending: false })
		.limit(1)
		.single();

	if (error && error.code !== 'PGRST116') {
		console.warn(`Warning loading score: ${error.message}`);
	}

	return data?.emotion_score || null;
}
