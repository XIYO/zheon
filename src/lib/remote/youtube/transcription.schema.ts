import * as v from 'valibot';

export const CollectTranscriptInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	force: v.optional(v.boolean(), false)
});
