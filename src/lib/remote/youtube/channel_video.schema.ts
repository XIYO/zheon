import * as v from 'valibot';

export const GetChannelVideosSchema = v.object({
	channelId: v.string(),
	cursor: v.optional(v.string()),
	limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
	sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest'),
	search: v.optional(v.string())
});

export const UpsertChannelVideosSchema = v.object({
	videos: v.array(
		v.object({
			channel_id: v.string(),
			video_id: v.string(),
			title: v.optional(v.string()),
			description: v.optional(v.string()),
			published_at: v.optional(v.string()),
			channel_title: v.optional(v.string()),
			thumbnail_url: v.optional(v.string()),
			thumbnail_width: v.optional(v.number()),
			thumbnail_height: v.optional(v.number()),
			playlist_id: v.optional(v.string()),
			position: v.optional(v.number()),
			video_data: v.optional(v.any())
		})
	)
});
