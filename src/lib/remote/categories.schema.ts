import * as v from 'valibot';

export const GetCategoriesSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});
