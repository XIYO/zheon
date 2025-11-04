import * as v from 'valibot';

export const GetSubscriptionsSchema = v.optional(
	v.object({
		cursor: v.optional(v.string()),
		limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
		sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest')
	})
);
