import * as v from 'valibot';

export const UpsertCategorySchema = v.object({
	slug: v.string(),
	name: v.string(),
	name_ko: v.string(),
	description: v.optional(v.string()),
	parent_slug: v.optional(v.string())
});

export const UpsertTagSchema = v.object({
	slug: v.string(),
	name: v.string(),
	name_ko: v.string(),
	description: v.optional(v.string())
});

export const UpsertMetricKeySchema = v.object({
	slug: v.string(),
	name: v.string(),
	name_ko: v.string(),
	description: v.string(),
	metric_type: v.optional(v.string()),
	category_hint: v.optional(v.string())
});
