export async function load({ params, locals: { supabase } }) {
	const { channelId } = params;

	try {
		// DB 캐시 직접 조회 (빠름)
		const { data: cachedChannel } = await supabase
			.from('channels')
			.select('channel_data, expires_at')
			.eq('channel_id', channelId)
			.single();

		// 캐시가 있고 유효한지 확인
		const now = new Date();
		const isValid = cachedChannel && new Date(cachedChannel.expires_at) > now;

		if (isValid) {
			// 캐시 히트 - 캐시된 비디오도 가져오기
			const { data: cachedVideos } = await supabase
				.from('channel_videos')
				.select('video_data')
				.eq('channel_id', channelId);

			// 즉시 캐시 데이터 반환 (백그라운드 갱신 제거)
			return {
				channel: cachedChannel.channel_data,
				videos: cachedVideos?.map((v) => v.video_data) || [],
				loading: false,
				cached: true,
				streamed: {
					data: null
				}
			};
		}

		// 캐시 미스 - placeholder 표시하고 백그라운드에서 데이터 로드
		return {
			channel: null,
			videos: [],
			loading: true,
			streamed: {
				data: (async () => {
					const { data, error } = await supabase.functions.invoke('youtube-channel', {
						body: { channelId }
					});

					if (error || !data?.success) {
						console.error('Failed to fetch channel:', error || data?.error);
						return {
							channel: null,
							videos: [],
							loading: false
						};
					}

					return {
						channel: data.channel || null,
						videos: data.videos || [],
						loading: false
					};
				})()
			}
		};
	} catch (err) {
		console.error('Error loading channel page:', err);
		return {
			channel: null,
			videos: [],
			loading: false,
			streamed: {
				data: null
			}
		};
	}
}
