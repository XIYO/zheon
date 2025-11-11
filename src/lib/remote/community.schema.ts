import * as v from 'valibot';

export const AnalyzeCommunitySchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	maxBatches: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(20)))
});

export const GetCommunitySchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});
