<script>
import { page } from '$app/state';
import { getSummaryById } from '$lib/remote/getSummaries.remote.js';
import { generateTTS } from '$lib/remote/ai.remote.js';
import { getAudioSignedUrl } from '$lib/remote/audio.remote.js';
import { getSummaryAudio } from '$lib/utils/audio-cache.js';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Loader from '@lucide/svelte/icons/loader';
import Play from '@lucide/svelte/icons/play';
import Pause from '@lucide/svelte/icons/pause';
import CircleX from '@lucide/svelte/icons/circle-x';

let summary = $derived(await getSummaryById({ id: page.params.id }));
const { summaryId } = generateTTS.fields;

let isLoadingAudio = $state(false);
let isPlaying = $state(false);
let audioElement = $state(null);
let currentAudioUrl = $state(null);

async function playAudio() {
	try {
		isLoadingAudio = true;

		const audioUrl = await getSummaryAudio(summary.id, getAudioSignedUrl);

		if (currentAudioUrl) {
			URL.revokeObjectURL(currentAudioUrl);
		}

		currentAudioUrl = audioUrl;

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

function togglePlayPause() {
	if (isPlaying) {
		audioElement?.pause();
	} else {
		if (audioElement?.src) {
			audioElement.play();
		} else {
			playAudio();
		}
	}
}

$effect(() => {
	if (audioElement) {
		audioElement.onplay = () => {
			isPlaying = true;
		};
		audioElement.onpause = () => {
			isPlaying = false;
		};
		audioElement.onended = () => {
			isPlaying = false;
		};
	}
});

$effect.pre(() => {
	const { supabase } = page.data;

	const needsUpdate = ['pending', 'processing'].includes(summary.summary_audio_status);

	if (!needsUpdate) return;

	const channel = supabase
		.channel(`summary-audio-${summary.id}`)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'summary',
				filter: `id=eq.${summary.id}`
			},
			async (payload) => {
				const updated = await getSummaryById({ id: summary.id });
				summary = updated;
			}
		)
		.subscribe((status, err) => {
			if (err) console.error('[Realtime] Audio status subscription error:', err);
		});

	return () => {
		channel.unsubscribe();
	};
});
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
					{#if isLoadingAudio}
						<button type="button" class="chip-icon preset-filled" disabled>
							<Loader size={16} class="animate-spin" />
						</button>
					{:else if isPlaying}
						<button type="button" class="chip-icon preset-filled" onclick={togglePlayPause}>
							<Pause size={16} />
						</button>
					{:else}
						<button type="button" class="chip-icon preset-filled" onclick={togglePlayPause}>
							<Play size={16} />
						</button>
					{/if}
				{:else if summary.summary_audio_status === 'pending' || summary.summary_audio_status === 'processing'}
					<button type="button" class="chip-icon preset-tonal" disabled>
						<Loader size={16} class="animate-spin" />
					</button>
				{:else if summary.summary_audio_status === 'failed'}
					<button type="button" class="chip-icon preset-tonal-error" disabled>
						<CircleX size={16} />
					</button>
				{:else}
					<form {...generateTTS}>
						<input {...summaryId.as('hidden', summary.id)} />
						<button type="submit" class="chip-icon preset-tonal">
							<Sparkles size={16} />
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
