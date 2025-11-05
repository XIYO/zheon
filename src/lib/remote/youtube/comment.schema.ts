import * as v from 'valibot';

export const CollectCommentsInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	maxComments: v.optional(v.number(), 100)
});
