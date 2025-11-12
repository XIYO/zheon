import * as v from 'valibot';

export const GetTagsSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});
