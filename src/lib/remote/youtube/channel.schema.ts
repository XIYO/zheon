import * as v from 'valibot';

export const ChannelDataSchema = v.object({
	channel_id: v.string(),
	title: v.optional(v.string()),
	custom_url: v.optional(v.string()),
	thumbnail_url: v.optional(v.string()),
	subscriber_count: v.optional(v.string()),
	description: v.optional(v.string()),
	video_count: v.optional(v.number()),
	channel_data: v.optional(v.any())
});

export const UpdateChannelStatusSchema = v.object({
	channel_id: v.string(),
	video_sync_status: v.picklist(['pending', 'processing', 'completed', 'failed']),
	video_synced_at: v.optional(v.string())
});
