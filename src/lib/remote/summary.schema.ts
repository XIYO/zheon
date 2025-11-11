import * as v from 'valibot';

export const SummarySchema = v.object({
	video_id: v.pipe(v.string(), v.minLength(1))
});

export const AnalyzeVideoInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	maxBatches: v.optional(v.number(), 5)
});

export const GetSummariesSchema = v.object({
	cursor: v.string(),
	limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(100)), 20),
	sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest'),
	direction: v.optional(v.picklist(['before', 'after']), 'before')
});

export const GetSummaryByIdSchema = v.object({
	id: v.string()
});
