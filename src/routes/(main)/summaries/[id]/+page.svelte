<script>
import { page } from '$app/state';
import { getSummaryById } from '$lib/remote/getSummaries.remote.js';
import { generateTTS } from '$lib/remote/ai.remote.js';
import { getAudioSignedUrl } from '$lib/remote/audio.remote.js';
import { getSummaryAudio } from '$lib/utils/audio-cache.js';

// 리모트 펑션으로 직접 데이터 가져오기
let summary = $derived(await getSummaryById({ id: page.params.id }));
const { summaryId } = generateTTS.fields;

// 오디오 재생 상태
let isLoadingAudio = $state(false);
let audioElement = $state(null);
let currentAudioUrl = $state(null);

/**
 * 오디오 재생
 */
async function playAudio(type = 'summary') {
	try {
		isLoadingAudio = true;

		// 오디오 가져오기 (캐시 우선)
		const audioUrl = await getSummaryAudio(summary.id, getAudioSignedUrl, type);

		// 기존 URL 해제 (메모리 누수 방지)
		if (currentAudioUrl) {
			URL.revokeObjectURL(currentAudioUrl);
		}

		currentAudioUrl = audioUrl;

		// 재생
		if (audioElement) {
			audioElement.src = audioUrl;
			await audioElement.play();
		}
	} catch (error) {
		console.error('Audio playback failed:', error);
		alert('오디오 재생에 실패했습니다.');
	} finally {
		isLoadingAudio = false;
	}
}
</script>

<main class="container mx-auto px-4 py-12 max-w-5xl">
	<header>
		<!-- 썸네일 -->
		<a href={summary.url} target="_blank" rel="noopener noreferrer">
			<img
				src={summary.thumbnail_url || ''}
				alt={summary.title}
				width="1280"
				height="720"
				class="rounded-xl starting:opacity-0 aspect-video"
			/>
		</a>
		<!-- 제목만 -->
		<div class="mt-8 mb-12">
			<h1 class="h1 mb-2">{summary.title}</h1>
		</div>
	</header>
	<!-- AI 요약 -->
	<section class="card preset-filled-surface-50-900 p-4">
		<header class="flex items-center justify-between mb-4">
			<h2 class="h2">AI 요약</h2>
			<div class="flex gap-2">
				{#if summary.summary_audio_status === 'completed'}
					<button
						class="chip preset-filled-primary"
						onclick={() => playAudio('summary')}
						disabled={isLoadingAudio}
						>
						{isLoadingAudio ? '로딩 중...' : '재생'}
					</button>
				{:else if summary.summary_audio_status === 'pending' || summary.summary_audio_status === 'processing'}
					<div class="chip preset-tonal-surface-500 flex items-center gap-2">
						<div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
						<span>생성 중...</span>
					</div>
				{:else if summary.summary_audio_status === 'failed'}
					<div class="chip preset-tonal-error-500 flex items-center gap-2">
						<span>생성 실패</span>
					</div>
			{:else}
				<form {...generateTTS}>
					<input {...summaryId.as('hidden', summary.id)} />
					<button
						type="submit"
						class="chip preset-tonal-primary-500"
						>
							AI음성 생성
						</button>
					</form>
				{/if}
			</div>
		</header>
		<p class="break-keep">
			{summary.summary}
		</p>
	</section>

	<!-- 오디오 플레이어 (숨김) -->
	<audio bind:this={audioElement} controls class="hidden"></audio>
</main>
