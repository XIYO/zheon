import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals: { supabase } }) {
	// DB에서 추천 채널 목록 가져오기
	const { data: channels, error } = await supabase
		.from('recommended_channels')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to fetch recommended channels:', error);
		return { channels: [] };
	}

	// 캐시에서 썸네일 업데이트
	const channelsWithThumbnails = await Promise.all(
		(channels || []).map(async (channel) => {
			// 이미 썸네일이 있으면 그대로 사용
			if (channel.thumbnail) {
				return channel;
			}

			// 없으면 캐시에서 가져오기
			const { data: cachedChannel } = await supabase
				.from('youtube_channel_cache')
				.select('channel_data')
				.eq('channel_id', channel.id)
				.single();

			return {
				...channel,
				thumbnail: cachedChannel?.channel_data?.thumbnail || null
			};
		})
	);

	return {
		channels: channelsWithThumbnails
	};
}

export const actions = {
	deleteChannel: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const channelId = formData.get('channelId')?.toString();

		if (!channelId) {
			return fail(400, { error: 'channelId is required' });
		}

		try {
			const { error: deleteError } = await supabase
				.from('recommended_channels')
				.delete()
				.eq('id', channelId);

			if (deleteError) {
				console.error('Failed to delete channel:', deleteError);
				return fail(500, { error: '채널 삭제에 실패했습니다' });
			}

			console.log(`✅ Channel deleted: ${channelId}`);
		} catch (err) {
			console.error('Error deleting channel:', err);
			return fail(500, { error: '채널 삭제 중 오류가 발생했습니다' });
		}

		// 성공 시 페이지 새로고침 (redirect)
		throw redirect(303, '/youtube');
	},

	addChannel: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const channelHandle = formData.get('channelHandle')?.toString()?.trim();

		if (!channelHandle) {
			return fail(400, { error: 'channelHandle is required' });
		}

		// @ 없으면 추가
		const normalizedHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;

		try {
			// 이미 존재하는 채널인지 확인
			const { data: existingChannel } = await supabase
				.from('recommended_channels')
				.select('id')
				.eq('handle', normalizedHandle)
				.single();

			if (existingChannel) {
				return fail(400, { error: '이미 추가된 채널입니다' });
			}

			// 임시 ID 생성 (채널 정보가 로드될 때까지 사용)
			const tempId = `temp-${Date.now()}`;

			// DB에 placeholder 먼저 저장 (빠른 응답을 위해)
			const { error: insertError } = await supabase
				.from('recommended_channels')
				.insert({
					id: tempId,
					handle: normalizedHandle,
					name: '로딩 중...',
					description: '',
					thumbnail: null
				});

			if (insertError) {
				console.error('Failed to insert placeholder:', insertError);
				return fail(500, { error: '채널 추가에 실패했습니다' });
			}

			console.log(`✅ Placeholder added: ${normalizedHandle}`);

			// 백그라운드로 Edge Function 호출 (fire-and-forget)
			supabase.functions
				.invoke('youtube-channel', {
					body: { channelId: normalizedHandle }
				})
				.then(async ({ data: channelData, error: fetchError }) => {
					if (fetchError || !channelData?.success) {
						console.error('❌ Background fetch failed:', fetchError || channelData?.error);
						// placeholder 삭제
						await supabase.from('recommended_channels').delete().eq('id', tempId);
						return;
					}

					const { channel } = channelData;

					// placeholder 삭제 후 실제 데이터로 새로 insert
					const { error: deleteError } = await supabase
						.from('recommended_channels')
						.delete()
						.eq('id', tempId);

					if (deleteError) {
						console.error('❌ Failed to delete placeholder:', deleteError);
						return;
					}

					const { error: insertError } = await supabase
						.from('recommended_channels')
						.insert({
							id: channel.id,
							handle: normalizedHandle,
							name: channel.name,
							description: channel.description || '',
							thumbnail: channel.thumbnail || null
						});

					if (insertError) {
						console.error('❌ Failed to insert real channel:', insertError);
					} else {
						console.log(`✅ Channel updated: ${channel.name} (${normalizedHandle})`);
					}
				})
				.catch((err) => {
					console.error('❌ Background fetch error:', err);
					// placeholder 삭제
					supabase.from('recommended_channels').delete().eq('id', tempId);
				});
		} catch (err) {
			console.error('Error adding channel:', err);
			return fail(500, { error: '채널 추가 중 오류가 발생했습니다' });
		}

		// 즉시 redirect (백그라운드 작업은 계속 실행됨)
		throw redirect(303, '/youtube');
	}
};
