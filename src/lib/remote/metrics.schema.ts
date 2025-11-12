import * as v from 'valibot';

export const GetMetricsSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});
