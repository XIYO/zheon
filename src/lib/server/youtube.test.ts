import { describe, it, expect } from 'vitest';
import { createYouTubeClient } from './youtube';

describe('youtube', () => {

	describe('createYouTubeClient', () => {
		it('클라이언트 생성', async () => {
			const client = await createYouTubeClient();

			expect(client).toBeDefined();
			expect(client.session).toBeDefined();
			expect(client.session.cache).toBeDefined();
		});
	});


	describe('기본 기능 테스트', () => {
		it('자막이 있는 영상 정보 조회', async () => {
			const client = await createYouTubeClient();

			const videoId = 'jNQXAC9IVRw';
			const info = await client.getInfo(videoId);

			expect(info).toBeDefined();
			expect(info.basic_info.id).toBe(videoId);
			expect(info.basic_info.title).toBeDefined();

			console.log('\n영상 정보:', {
				id: info.basic_info.id,
				title: info.basic_info.title,
				duration: info.basic_info.duration
			});
		}, 15000);

		it('자막 추출 가능 여부 확인', async () => {
			const client = await createYouTubeClient();

			const videoId = 'jNQXAC9IVRw';
			const info = await client.getInfo(videoId);
			const transcript = await info.getTranscript();

			expect(transcript).toBeDefined();

			if (transcript?.transcript?.content?.body?.initial_segments) {
				const segments = transcript.transcript.content.body.initial_segments;
				console.log('\n자막 세그먼트 개수:', segments.length);
				console.log('첫 번째 세그먼트:', segments[0]?.snippet?.text);

				expect(segments.length).toBeGreaterThan(0);
			}
		}, 15000);
	});
});
