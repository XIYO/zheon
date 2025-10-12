import { error } from '@sveltejs/kit';

export async function load({ params, locals: { supabase } }) {
	const { channelId } = params;

	try {
		// 채널 정보 조회
		const { data: channel, error: channelError } = await supabase
			.from('channels')
			.select('*')
			.eq('channel_id', channelId)
			.single();

		// 채널 비디오 목록 조회
		const { data: videos, error: videosError } = await supabase
			.from('channel_videos')
			.select('*')
			.eq('channel_id', channelId)
			.order('published_at', { ascending: false });

		// 채널이 없으면 빈 상태 반환 (나중에 Edge Function으로 가져올 수 있음)
		if (!channel && !channelError?.code?.includes('PGRST116')) {
			console.error('Error fetching channel:', channelError);
		}

		return {
			channel: channel || null,
			videos: videos || [],
			loading: false,
			lastUpdated: channel?.updated_at || null
		};
	} catch (err) {
		console.error('Error loading channel page:', err);
		return {
			channel: null,
			videos: [],
			loading: false,
			lastUpdated: null
		};
	}
}

export const actions = {
	refreshChannel: async ({ params, locals: { supabase } }) => {
		const { channelId } = params;

		try {
			// Edge Function 호출하여 채널 + 비디오 새로고침
			const { data, error: funcError } = await supabase.functions.invoke(
				'youtube-channel',
				{
					body: { channelId, forceRefresh: true }
				}
			);

			if (funcError) {
				console.error('Channel refresh error:', funcError);
				return {
					success: false,
					error: funcError.message
				};
			}

			// 채널 정보 직접 업데이트 (Edge Function이 이미 처리했지만 확실히)
			if (data?.channel) {
				await supabase
					.from('channels')
					.upsert({
						channel_id: channelId,
						channel_name: data.channel.name,
						channel_avatar: data.channel.thumbnail,
						subscriber_count: data.channel.subscriberCount,
						description: data.channel.description,
						channel_data: data.channel
					});
			}

			// 비디오 목록 업데이트
			if (data?.videos && data.videos.length > 0) {
				// 기존 비디오 삭제
				await supabase
					.from('channel_videos')
					.delete()
					.eq('channel_id', channelId);

				// 새 비디오 추가
				const videoInserts = data.videos.map(video => ({
					video_id: video.id,
					channel_id: channelId,
					title: video.title,
					thumbnail_url: video.thumbnail,
					published_at: video.publishedAt,
					video_data: video
				}));

				await supabase
					.from('channel_videos')
					.insert(videoInserts);
			}

			return {
				success: true,
				videosCount: data?.videos?.length || 0
			};
		} catch (err) {
			console.error('Refresh error:', err);
			return {
				success: false,
				error: err.message
			};
		}
	}
};