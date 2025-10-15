import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
	// CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { channelId } = await req.json();

		if (!channelId) {
			return new Response(
				JSON.stringify({ error: '채널 ID가 필요합니다' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// TODO: 구현 예정
		// - Google YouTube Data API v3 호출하여 채널 정보 및 비디오 목록 수집
		// - 또는 백엔드 서버의 youtube.js 모듈을 통한 데이터 수집
		// - channel_videos 테이블에 데이터 INSERT
		// - 처리 상태(processing_status) 업데이트: pending → processing → completed

		console.log(`[youtube-sync] 채널 동기화 요청: ${channelId}`);

		// 즉시 성공 응답 반환
		return new Response(
			JSON.stringify({
				success: true,
				message: '동기화 시작됨',
				channelId
			}),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);

	} catch (error) {
		console.error('[youtube-sync] Error:', error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
