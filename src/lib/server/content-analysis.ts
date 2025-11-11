import { parse } from 'valibot';
import { UpsertCategorySchema, UpsertTagSchema, UpsertMetricKeySchema } from './content-analysis.schema';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('valibot').InferInput<typeof UpsertCategorySchema>} data
 */
export async function upsertCategory(supabase, data) {
	const validated = parse(UpsertCategorySchema, data);

	let parent_id = null;
	let depth = 0;
	let path = [validated.slug];

	if (validated.parent_slug) {
		const { data: parent, error: parentError } = await supabase
			.from('categories')
			.select('id, depth, path')
			.eq('slug', validated.parent_slug)
			.maybeSingle();

		if (parentError || !parent) {
			console.warn(`[upsertCategory] Parent category not found: ${validated.parent_slug}, creating as root category`);
		} else {
			parent_id = parent.id;
			depth = parent.depth + 1;
			path = [...parent.path, validated.slug];
		}
	}

	const { data: result, error } = await supabase
		.from('categories')
		.upsert(
			{
				slug: validated.slug,
				name: validated.name,
				name_ko: validated.name_ko,
				description: validated.description || null,
				parent_id,
				depth,
				path,
				updated_at: new Date().toISOString()
			},
			{
				onConflict: 'slug',
				ignoreDuplicates: false
			}
		)
		.select()
		.single();

	if (error) throw error;
	return result;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('valibot').InferInput<typeof UpsertTagSchema>} data
 */
export async function upsertTag(supabase, data) {
	const validated = parse(UpsertTagSchema, data);

	const { data: result, error } = await supabase
		.from('tags')
		.upsert(
			{
				slug: validated.slug,
				name: validated.name,
				name_ko: validated.name_ko,
				description: validated.description || null,
				updated_at: new Date().toISOString()
			},
			{
				onConflict: 'slug',
				ignoreDuplicates: false
			}
		)
		.select()
		.single();

	if (error) throw error;
	return result;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('valibot').InferInput<typeof UpsertMetricKeySchema>} data
 */
export async function upsertMetricKey(supabase, data) {
	const validated = parse(UpsertMetricKeySchema, data);

	const { data: existing } = await supabase
		.from('content_metric_keys')
		.select('id')
		.or(`slug.eq.${validated.slug},name.eq.${validated.name}`)
		.maybeSingle();

	if (existing) {
		const { data: result, error } = await supabase
			.from('content_metric_keys')
			.update({
				slug: validated.slug,
				name: validated.name,
				name_ko: validated.name_ko,
				description: validated.description,
				metric_type: validated.metric_type || 'score',
				category_hint: validated.category_hint || null,
				value_range: { min: 0, max: 100 },
				updated_at: new Date().toISOString()
			})
			.eq('id', existing.id)
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	const { data: result, error } = await supabase
		.from('content_metric_keys')
		.insert({
			slug: validated.slug,
			name: validated.name,
			name_ko: validated.name_ko,
			description: validated.description,
			metric_type: validated.metric_type || 'score',
			category_hint: validated.category_hint || null,
			value_range: { min: 0, max: 100 },
			updated_at: new Date().toISOString()
		})
		.select()
		.single();

	if (error) throw error;
	return result;
}
