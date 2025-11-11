<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import { generateTTS } from '$lib/remote/audio.remote';
	import { getAudioSignedUrl } from '$lib/remote/audio.remote';
	import { getSummaryAudio } from '$lib/utils/audio-cache.js';
	import { extractVideoId, getYouTubeThumbnail } from '$lib/utils/youtube';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Loader from '@lucide/svelte/icons/loader';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import CircleX from '@lucide/svelte/icons/circle-x';

	let { id } = $props();

	const summaryStore = getSummaryStore();
	const summaryPromise = summaryStore.detail(id);
	const { summaryId } = generateTTS.fields;

	let isLoadingAudio = $state(false);
	let isPlaying = $state(false);
	let audioElement = $state(null);
	let currentAudioUrl = $state(null);

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
</script>

{#await summaryPromise}
	<main class="container mx-auto px-4 py-12 max-w-5xl">
		<div class="text-center py-12 text-surface-500-400">
			<p>로딩 중...</p>
		</div>
	</main>
{:then summary}
	<main class="container mx-auto px-4 py-12 max-w-5xl">
		<header>
			<a href={summary.url} target="_blank" rel="noopener noreferrer">
				<img
					src={getYouTubeThumbnail(extractVideoId(summary.url), 'maxresdefault')}
					alt={summary.title}
					width="1280"
					height="720"
					class="rounded-xl starting:opacity-0 aspect-video" />
			</a>
			<div class="mt-8 mb-12">
				<h1 class="h1 mb-2">{summary.title}</h1>
			</div>
		</header>
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

		{#if summary.analysis_status === 'completed'}
			<section class="card preset-filled-surface-50-900 p-4 mt-6">
				<header class="mb-4">
					<h2 class="h2">커뮤니티 신뢰도 분석</h2>
				</header>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div class="rounded-lg bg-surface-200 dark:bg-surface-700 p-4">
						<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">감정 점수</p>
						<p class="h3">
							{#if summary.sentiment_overall_score > 0}
								+{summary.sentiment_overall_score}%
							{:else}
								{summary.sentiment_overall_score || 0}%
							{/if}
						</p>
					</div>

					<div class="rounded-lg bg-surface-200 dark:bg-surface-700 p-4">
						<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">커뮤니티 품질</p>
						<p class="h3">
							{summary.community_quality_score || 0}%
						</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<p class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
							감정 분포
						</p>
						<div class="space-y-2">
							<div class="flex items-center gap-2">
								<span class="text-sm w-16">긍정</span>
								<div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded h-6 overflow-hidden">
									<div
										class="h-full bg-green-500"
										style="width: {summary.sentiment_positive_ratio || 0}%">
									</div>
								</div>
								<span class="text-sm w-12 text-right">
									{summary.sentiment_positive_ratio || 0}%
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-sm w-16">중립</span>
								<div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded h-6 overflow-hidden">
									<div
										class="h-full bg-gray-500"
										style="width: {summary.sentiment_neutral_ratio || 0}%">
									</div>
								</div>
								<span class="text-sm w-12 text-right">
									{summary.sentiment_neutral_ratio || 0}%
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-sm w-16">부정</span>
								<div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded h-6 overflow-hidden">
									<div
										class="h-full bg-red-500"
										style="width: {summary.sentiment_negative_ratio || 0}%">
									</div>
								</div>
								<span class="text-sm w-12 text-right">
									{summary.sentiment_negative_ratio || 0}%
								</span>
							</div>
						</div>
					</div>

					{#if summary.ai_audience_reaction}
						<div>
							<p class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
								청중 반응
							</p>
							<p class="text-sm text-surface-600 dark:text-surface-400">
								{summary.ai_audience_reaction}
							</p>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
								커뮤니티 특성
							</p>
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>친절도</span>
									<span>{summary.community_kindness || 0}%</span>
								</div>
								<div class="flex justify-between text-sm">
									<span>독성도</span>
									<span>{summary.community_toxicity || 0}%</span>
								</div>
								<div class="flex justify-between text-sm">
									<span>건설적</span>
									<span>{summary.community_constructive || 0}%</span>
								</div>
							</div>
						</div>

						<div>
							<p class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
								연령대 분포
							</p>
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>10대</span>
									<span>{summary.age_group_teens || 0}%</span>
								</div>
								<div class="flex justify-between text-sm">
									<span>20대</span>
									<span>{summary.age_group_20s || 0}%</span>
								</div>
								<div class="flex justify-between text-sm">
									<span>30대</span>
									<span>{summary.age_group_30s || 0}%</span>
								</div>
								<div class="flex justify-between text-sm">
									<span>40대+</span>
									<span>{summary.age_group_40plus || 0}%</span>
								</div>
							</div>
						</div>
					</div>

					<div class="text-xs text-surface-500 dark:text-surface-500">
						최근 댓글 {summary.total_comments_analyzed || 0}개 분석
					</div>
				</div>
			</section>
		{:else}
			<section class="card preset-filled-surface-50-900 p-4 mt-6">
				<p class="text-surface-500">
					아직 커뮤니티 신뢰도 분석이 진행 중입니다. 잠시 후 다시 확인해주세요.
				</p>
			</section>
		{/if}

		<audio bind:this={audioElement} controls class="hidden"></audio>
	</main>
{:catch error}
	<main class="container mx-auto px-4 py-12 max-w-5xl">
		<div class="text-center py-12 text-error-500">
			<p>데이터를 불러오는데 실패했습니다</p>
			<p class="text-sm mt-2">{error.message}</p>
		</div>
	</main>
{/await}
