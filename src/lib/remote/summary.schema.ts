import * as v from 'valibot';

const isYouTubeUrl = (input) => {
	try {
		const url = new URL(input);
		const hostname = url.hostname.toLowerCase();
		return (
			hostname === 'youtube.com' ||
			hostname === 'www.youtube.com' ||
			hostname === 'youtu.be' ||
			hostname === 'm.youtube.com'
		);
	} catch {
		return false;
	}
};

export const SummarySchema = v.object({
	url: v.pipe(
		v.string('URL을 입력해주세요'),
		v.trim(),
		v.nonEmpty('URL을 입력해주세요'),
		v.url('올바른 URL 형식이 아닙니다'),
		v.check(isYouTubeUrl, 'YouTube URL만 지원됩니다')
	)
});

export const AnalyzeVideoInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	maxComments: v.optional(v.number(), 100)
});

export const GetSummariesSchema = v.optional(
	v.object({
		cursor: v.optional(v.string()),
		limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
		sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest')
	})
);

export const GetSummaryByIdSchema = v.object({
	id: v.string()
});
