# YouTube 자막 번역 및 한국어 TTS 오버레이 기능

## 개요

YouTube 영상에서 영어 자막을 추출하여 한국어로 번역하고, TTS로 생성한 한국어 음성을 영상에 오버레이하는 기능.

## 기술적 가능성

### YouTube iframe API 공식 지원 기능

모든 기능이 YouTube 공식 iframe API로 제공됨.

| 기능             | 메서드/이벤트          | 설명                            |
| ---------------- | ---------------------- | ------------------------------- |
| 현재 재생 시간   | `getCurrentTime()`     | 현재 재생 위치를 초 단위로 반환 |
| 음소거 제어      | `mute()` / `unMute()`  | YouTube 원본 음성 제어          |
| 재생 상태        | `getPlayerState()`     | 1=재생, 2=일시정지, 0=종료 등   |
| 재생 속도        | `getPlaybackRate()`    | 1.0, 1.25, 1.5, 2.0 등          |
| 상태 변경 이벤트 | `onStateChange`        | 재생/일시정지 감지              |
| 속도 변경 이벤트 | `onPlaybackRateChange` | 속도 변경 감지                  |

참고: https://developers.google.com/youtube/iframe_api_reference

### 실제 구현 사례

- Language Reactor: YouTube 음소거 + 커스텀 자막 + 커스텀 오디오
- Udemy, Coursera: iframe 재생 시간 추적으로 진도율 체크
- 모든 YouTube 임베드 플레이어: 이 API 사용

## 구현 아키텍처

### 1. 데이터 흐름

```
영어 자막 추출 (youtube-transcript)
    ↓
AI 번역 (문맥 유지, 문장 단위)
    ↓
TTS 생성 (세그먼트별 오디오 파일)
    ↓
Supabase Storage 업로드
    ↓
DB 저장 (video_subtitles)
    ↓
클라이언트 재생 (YouTube iframe API 동기화)
```

### 2. DB 스키마

```sql
CREATE TABLE video_subtitles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  language TEXT NOT NULL,
  segments JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_subtitles_video_language
ON video_subtitles(video_id, language);
```

segments JSONB 구조:

```json
[
	{
		"start": 0.0,
		"duration": 2.5,
		"text": "안녕하세요 여러분",
		"audioUrl": "https://storage.supabase.co/.../segment_0.mp3"
	},
	{
		"start": 2.5,
		"duration": 3.0,
		"text": "오늘은 흥미로운 주제를 다뤄보겠습니다",
		"audioUrl": "https://storage.supabase.co/.../segment_1.mp3"
	}
]
```

### 3. 서비스 레이어

```js
// src/lib/server/services/youtube/subtitle-translation.service.ts
export class SubtitleTranslationService {
	// 영어 자막 추출 후 번역
	async translateSubtitles(videoId, targetLang = 'ko') {
		const transcripts = await transcriptionService.getTranscript(videoId, 'en');
		const translated = await this.batchTranslate(transcripts, targetLang);
		return translated;
	}

	// 배치 번역 (5-10개씩 묶어서 문맥 유지)
	async batchTranslate(segments, targetLang) {
		const batchSize = 10;
		const results = [];

		for (let i = 0; i < segments.length; i += batchSize) {
			const batch = segments.slice(i, i + batchSize);
			const prompt = `다음 영어 자막을 한국어로 번역하세요. 문맥을 유지하며 자연스럽게 번역하세요:\n\n${batch.map((s, idx) => `${idx + 1}. ${s.text}`).join('\n')}`;

			const response = await aiService.translate(prompt);
			results.push(...response);
		}

		return segments.map((seg, idx) => ({
			...seg,
			text: results[idx]
		}));
	}
}

// src/lib/server/services/youtube/subtitle-tts.service.ts
export class SubtitleTTSService {
	// 번역된 자막에 TTS 생성
	async generateAudioSegments(videoId, translatedSubtitles) {
		const segments = [];

		for (const subtitle of translatedSubtitles) {
			const audioBlob = await this.generateTTS(subtitle.text);
			const audioUrl = await this.uploadToStorage(videoId, subtitle.start, audioBlob);

			segments.push({
				start: subtitle.start,
				duration: subtitle.duration,
				text: subtitle.text,
				audioUrl
			});
		}

		return segments;
	}

	async generateTTS(text) {
		// OpenAI TTS API
		const response = await openai.audio.speech.create({
			model: 'tts-1-hd',
			voice: 'nova',
			input: text,
			speed: 1.0
		});

		return response.blob();
	}

	async uploadToStorage(videoId, timestamp, audioBlob) {
		const fileName = `${videoId}/segments/${timestamp}.mp3`;
		const { data, error } = await supabase.storage
			.from('subtitle-audio')
			.upload(fileName, audioBlob);

		if (error) throw error;

		const {
			data: { publicUrl }
		} = supabase.storage.from('subtitle-audio').getPublicUrl(fileName);

		return publicUrl;
	}
}
```

### 4. Remote Function

```js
// src/lib/remote/youtube/subtitle.remote.ts
export const getSubtitleWithAudio = remote(
	'youtube/subtitle/with-audio',
	async ({ videoId, lang = 'ko' }) => {
		const { data: existing } = await supabase
			.from('video_subtitles')
			.select('segments')
			.eq('video_id', videoId)
			.eq('language', lang)
			.single();

		if (existing) return existing.segments;

		// 생성
		const translated = await subtitleTranslationService.translateSubtitles(videoId, lang);
		const segments = await subtitleTTSService.generateAudioSegments(videoId, translated);

		await supabase.from('video_subtitles').insert({
			video_id: videoId,
			language: lang,
			segments
		});

		return segments;
	}
);
```

### 5. 클라이언트 구현

```svelte
<!-- src/lib/components/SummaryDetail.svelte -->
<script>
	import { onMount } from 'svelte';
	import { getSubtitleWithAudio } from '$lib/remote/youtube/subtitle.remote';

	let { videoId } = $props();

	let player = $state(null);
	let audioElement = $state(null);
	let currentSubtitle = $state('');
	let subtitles = $state([]);
	let isKoreanAudioEnabled = $state(false);

	onMount(async () => {
		// 자막 데이터 로드
		subtitles = await getSubtitleWithAudio({ videoId, lang: 'ko' });

		// YouTube iframe API 로드
		if (!window.YT) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(tag);
		}

		window.onYouTubeIframeAPIReady = () => {
			player = new YT.Player('youtube-player', {
				videoId,
				events: {
					onReady: onPlayerReady,
					onStateChange: onPlayerStateChange,
					onPlaybackRateChange: onPlaybackRateChange
				}
			});
		};

		return () => {
			if (player) player.destroy();
		};
	});

	function onPlayerReady() {
		if (isKoreanAudioEnabled) {
			player.mute();
			startAudioSync();
		}
	}

	function onPlayerStateChange(event) {
		if (!isKoreanAudioEnabled || !audioElement) return;

		if (event.data === YT.PlayerState.PLAYING) {
			syncAndPlayAudio();
		} else if (event.data === YT.PlayerState.PAUSED) {
			audioElement.pause();
		}
	}

	function onPlaybackRateChange(event) {
		if (audioElement) {
			audioElement.playbackRate = event.data;
		}
	}

	function toggleKoreanAudio() {
		isKoreanAudioEnabled = !isKoreanAudioEnabled;

		if (isKoreanAudioEnabled) {
			player.mute();
			startAudioSync();
		} else {
			player.unMute();
			if (audioElement) audioElement.pause();
		}
	}

	function startAudioSync() {
		let animationId;
		let currentSegment = null;

		function update() {
			if (!player || !isKoreanAudioEnabled) {
				animationId = requestAnimationFrame(update);
				return;
			}

			const videoTime = player.getCurrentTime();
			const playerState = player.getPlayerState();

			const segment = subtitles.find(
				(sub) => videoTime >= sub.start && videoTime < sub.start + sub.duration
			);

			if (segment && segment !== currentSegment) {
				currentSegment = segment;
				currentSubtitle = segment.text;

				if (playerState === YT.PlayerState.PLAYING) {
					playAudioSegment(segment, videoTime);
				}
			} else if (!segment) {
				currentSegment = null;
				currentSubtitle = '';
			}

			animationId = requestAnimationFrame(update);
		}

		update();

		return () => cancelAnimationFrame(animationId);
	}

	function playAudioSegment(segment, videoTime) {
		if (!audioElement) return;

		audioElement.src = segment.audioUrl;

		const offset = videoTime - segment.start;
		audioElement.currentTime = offset;
		audioElement.playbackRate = player.getPlaybackRate();

		audioElement.play().catch((e) => console.error('오디오 재생 실패:', e));
	}

	function syncAndPlayAudio() {
		const videoTime = player.getCurrentTime();
		const segment = subtitles.find(
			(sub) => videoTime >= sub.start && videoTime < sub.start + sub.duration
		);

		if (segment) {
			playAudioSegment(segment, videoTime);
		}
	}
</script>

<div class="video-container">
	<!-- YouTube iframe -->
	<div id="youtube-player"></div>

	<!-- 자막 오버레이 -->
	{#if currentSubtitle}
		<div class="subtitle-overlay">
			{currentSubtitle}
		</div>
	{/if}

	<!-- 한국어 음성 토글 -->
	<button class="audio-toggle" onclick={toggleKoreanAudio}>
		{isKoreanAudioEnabled ? '원본 음성' : '한국어 음성'}
	</button>
</div>

<audio bind:this={audioElement} />

<style>
	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
	}

	.subtitle-overlay {
		position: absolute;
		bottom: 60px;
		left: 0;
		right: 0;
		text-align: center;
		color: white;
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 16px;
		font-size: 20px;
		font-weight: 600;
		pointer-events: none;
	}

	.audio-toggle {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 10;
	}
</style>
```

## 비용 및 고려사항

### TTS API 비용

| 서비스           | 가격           | 품질 | 속도 |
| ---------------- | -------------- | ---- | ---- |
| OpenAI TTS-1     | $15/1M chars   | 보통 | 빠름 |
| OpenAI TTS-1-HD  | $30/1M chars   | 높음 | 중간 |
| Google Cloud TTS | $16/1M chars   | 높음 | 빠름 |
| ElevenLabs       | $22/100K chars | 최고 | 느림 |

10분 영상 기준:

- 자막 텍스트: 약 1,500자
- OpenAI TTS-1-HD: 약 $0.045
- 영상 1,000개: 약 $45

### 저장 공간

- 세그먼트당 오디오: 약 50-100KB
- 10분 영상: 약 50-100개 세그먼트 = 5-10MB
- 영상 1,000개: 약 5-10GB
- Supabase Storage: 무료 1GB, 이후 $0.021/GB/월

### 동기화 정확도

- 네트워크 지연: 50-200ms
- 완벽한 립싱크는 어려움
- 오디오 세그먼트 사전 로드로 완화 가능

### 추가 기능

- 자막 on/off 토글
- 폰트 크기 조절
- 위치 조절 (상단/하단)
- 이중 자막 (원문 + 번역)
- 클릭해서 특정 구간 이동
- 재생 속도별 자동 동기화

## 구현 우선순위

1. YouTube iframe API 연동 (SummaryDetail.svelte 수정)
2. 자막 오버레이 UI 구현
3. DB 스키마 추가 (video_subtitles)
4. SubtitleTranslationService 구현
5. SubtitleTTSService 구현
6. Remote Function 구현
7. 한국어 음성 토글 기능
8. 오디오 동기화 로직

## 참고

- YouTube iframe API: https://developers.google.com/youtube/iframe_api_reference
- OpenAI TTS: https://platform.openai.com/docs/guides/text-to-speech
- Supabase Storage: https://supabase.com/docs/guides/storage
