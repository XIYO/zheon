<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import { generateTTS } from '$lib/remote/audio.remote';
	import { getAudioSignedUrl } from '$lib/remote/audio.remote';
	import { getSummaryAudio } from '$lib/utils/audio-cache.js';
	import { getYouTubeThumbnail } from '$lib/utils/youtube';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import Loader from '@lucide/svelte/icons/loader';
    import Play from '@lucide/svelte/icons/play';
    import Pause from '@lucide/svelte/icons/pause';
    import CircleX from '@lucide/svelte/icons/circle-x';
    import RadarChart from './RadarChart.svelte';
    import PieChart from './PieChart.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
	const { summaryId } = generateTTS.fields;

	let summary = $derived(await summaryStore.detail(videoId));

	const emotionLabels: Record<string, string> = {
		joy: '기쁨',
		trust: '신뢰',
		fear: '공포',
		surprise: '놀람',
		sadness: '슬픔',
		disgust: '혐오',
		anger: '분노',
		anticipation: '기대'
	};

	const emotionColors: Record<string, string> = {
		joy: 'hsl(45, 100%, 60%)',
		trust: 'hsl(120, 70%, 50%)',
		fear: 'hsl(270, 60%, 60%)',
		surprise: 'hsl(30, 90%, 65%)',
		sadness: 'hsl(210, 60%, 50%)',
		disgust: 'hsl(300, 50%, 50%)',
		anger: 'hsl(0, 70%, 55%)',
		anticipation: 'hsl(180, 50%, 55%)'
	};

	const ageColors: Record<string, string> = {
		teens: 'hsl(280, 70%, 60%)',
		twenties: 'hsl(210, 70%, 55%)',
		thirties: 'hsl(160, 60%, 50%)',
		forty_plus: 'hsl(30, 70%, 55%)'
	};

    let isLoadingAudio = $state(false);
    let isPlaying = $state(false);
    let audioElement = $state<HTMLAudioElement | null>(null);
    let currentAudioUrl = $state<string | null>(null);

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

	async function togglePlayPause() {
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
		} else {
			if (!currentAudioUrl) {
				isLoadingAudio = true;
				try {
					const audioUrl = await getSummaryAudio(videoId, getAudioSignedUrl);
					currentAudioUrl = audioUrl;
					audioElement.src = audioUrl;
				} catch (err) {
					console.error('오디오 로드 실패:', err);
					return;
				} finally {
					isLoadingAudio = false;
				}
			}
			audioElement.play();
    }
	}
</script>

{#if !summary}
	<main class="container mx-auto px-4 py-12 max-w-5xl">
		<header>
			<a
				href={`https://www.youtube.com/watch?v=${videoId}`}
				target="_blank"
				rel="noopener noreferrer">
				<img
					src={getYouTubeThumbnail(videoId, 'maxresdefault')}
					alt="YouTube 썸네일"
					width="1280"
					height="720"
					class="rounded-xl starting:opacity-0 aspect-video" />
			</a>
			<div class="mt-8 mb-12">
				<div class="placeholder animate-pulse h-10 rounded w-3/4"></div>
			</div>
		</header>

		<section class="card preset-filled-surface-50-900 p-4">
			<header class="flex items-center justify-between mb-4">
				<h2 class="h2">AI 요약</h2>
				<div class="placeholder-circle animate-pulse size-10"></div>
			</header>
			<div class="space-y-3">
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
			</div>
		</section>

		<section class="card preset-filled-surface-50-900 p-4 mt-6">
			<header class="mb-4">
				<h2 class="h2">커뮤니티 신뢰도 분석</h2>
			</header>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div class="rounded-lg bg-surface-200 dark:bg-surface-700 p-4">
					<p class="text-sm text-surface-600-400 mb-1">감정 점수</p>
					<div class="placeholder animate-pulse h-8 w-16 rounded"></div>
				</div>

				<div class="rounded-lg bg-surface-200 dark:bg-surface-700 p-4">
					<p class="text-sm text-surface-600-400 mb-1">커뮤니티 품질</p>
					<div class="placeholder animate-pulse h-8 w-16 rounded"></div>
				</div>
			</div>

			<div class="space-y-4">
				<div>
					<p class="text-sm font-semibold text-surface-700-300 mb-2">
						감정 분포
					</p>
					<div class="space-y-2">
						{#each ['긍정', '중립', '부정'] as label}
							<div class="flex items-center gap-2">
								<span class="text-sm w-16">{label}</span>
								<div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded h-6 overflow-hidden">
									<div class="placeholder animate-pulse h-full w-0"></div>
								</div>
								<div class="placeholder animate-pulse h-4 w-12 rounded"></div>
							</div>
						{/each}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm font-semibold text-surface-700-300 mb-2">
							커뮤니티 특성
						</p>
						<div class="space-y-1">
							{#each ['친절도', '독성도', '건설적'] as label}
								<div class="flex justify-between text-sm">
									<span>{label}</span>
									<div class="placeholder animate-pulse h-4 w-12 rounded"></div>
								</div>
							{/each}
						</div>
					</div>

					<div>
						<p class="text-sm font-semibold text-surface-700-300 mb-2">
							연령대 분포
						</p>
						<div class="space-y-1">
							{#each ['10대', '20대', '30대', '40대+'] as label}
								<div class="flex justify-between text-sm">
									<span>{label}</span>
									<div class="placeholder animate-pulse h-4 w-12 rounded"></div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>
{:else}
	<main class="container mx-auto px-4 py-12 max-w-5xl">
		<header>
			<a
				href={`https://www.youtube.com/watch?v=${summary.video_id}`}
				target="_blank"
				rel="noopener noreferrer">
				<img
					src={getYouTubeThumbnail(summary.video_id, 'maxresdefault')}
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
				{#if summary.summary}
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
				{:else}
					<div class="placeholder-circle animate-pulse size-10"></div>
				{/if}
			</header>
			{#if summary.summary}
				<p class="break-keep">
					{summary.summary}
				</p>
			{:else}
				<div class="space-y-3">
					<div class="placeholder animate-pulse h-4 rounded"></div>
					<div class="placeholder animate-pulse h-4 rounded"></div>
					<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
				</div>
			{/if}
		</section>


		<section class="card preset-filled-surface-50-900 p-4 mt-6">
			<header class="mb-6">
				<h2 class="h2">커뮤니티 분석</h2>
			</header>

			{#if summary.community}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<!-- 감정 분포 (Plutchik 8축 레이더) -->
					<div class="space-y-3">
						<h3 class="font-bold text-center">감정 분포</h3>
						<RadarChart
							data={{
								joy: summary.community.emotion_joy ?? 0,
								trust: summary.community.emotion_trust ?? 0,
								fear: summary.community.emotion_fear ?? 0,
								surprise: summary.community.emotion_surprise ?? 0,
								sadness: summary.community.emotion_sadness ?? 0,
								disgust: summary.community.emotion_disgust ?? 0,
								anger: summary.community.emotion_anger ?? 0,
								anticipation: summary.community.emotion_anticipation ?? 0
							}}
						/>
						<p class="text-sm text-surface-600-400 text-center">
							지배 감정: <span class="font-semibold">{summary.community.emotion_dominant}</span>
							· Valence {summary.community.valence_mean ?? 0} · Arousal {summary.community.arousal_mean ?? 0}
						</p>
						{#if summary.community.representative_comments?.emotions}
							<div class="text-xs text-surface-600-400 mt-4">
								<h4 class="font-semibold mb-2">대표 댓글</h4>
								<div class="space-y-2">
									{#each Object.entries(summary.community.representative_comments.emotions) as [emotion, comment]}
										<div class="py-1 pl-3 border-l-2" style="border-color: {emotionColors[emotion]}">
											<span class="font-semibold">{emotionLabels[emotion]}:</span>
											{#if comment === '-'}
												<p class="text-surface-400-600 mt-0.5">-</p>
											{:else}
												<p class="italic text-surface-700-300 mt-0.5">"{comment}"</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- 연령 도넛 -->
					<div class="space-y-3">
						<h3 class="font-bold text-center">연령 분포</h3>
						<PieChart
							data={[
								{ label: '10대', value: summary.community.age_teens ?? 0 },
								{ label: '20대', value: summary.community.age_20s ?? 0 },
								{ label: '30대', value: summary.community.age_30s ?? 0 },
								{ label: '40대+', value: summary.community.age_40plus ?? 0 }
							]}
							innerRadius={0.6}
						/>
						<p class="text-sm text-surface-600-400 text-center">
							중앙값 나이: <span class="font-semibold">{summary.community.age_median ?? 0}</span>
							· 성인 비율: {summary.community.age_adult_ratio ?? 0}%
						</p>
						{#if summary.community.representative_comments?.age_groups}
							<div class="text-xs text-surface-600-400 mt-4">
								<h4 class="font-semibold mb-2">대표 댓글</h4>
								<div class="space-y-2">
									<div class="py-1 pl-3 border-l-2" style="border-color: {ageColors.teens}">
										<span class="font-semibold">10대:</span>
										{#if summary.community.representative_comments.age_groups.teens === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">"{summary.community.representative_comments.age_groups.teens}"</p>
										{/if}
									</div>
									<div class="py-1 pl-3 border-l-2" style="border-color: {ageColors.twenties}">
										<span class="font-semibold">20대:</span>
										{#if summary.community.representative_comments.age_groups.twenties === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">"{summary.community.representative_comments.age_groups.twenties}"</p>
										{/if}
									</div>
									<div class="py-1 pl-3 border-l-2" style="border-color: {ageColors.thirties}">
										<span class="font-semibold">30대:</span>
										{#if summary.community.representative_comments.age_groups.thirties === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">"{summary.community.representative_comments.age_groups.thirties}"</p>
										{/if}
									</div>
									<div class="py-1 pl-3 border-l-2" style="border-color: {ageColors.forty_plus}">
										<span class="font-semibold">40대+:</span>
										{#if summary.community.representative_comments.age_groups.forty_plus === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">"{summary.community.representative_comments.age_groups.forty_plus}"</p>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="text-xs text-surface-500 mt-6 text-right">
					최근 댓글 {summary.community.comments_analyzed ?? 0}개 분석 · {summary.community.analysis_model}
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div class="space-y-3">
						<h3 class="font-bold text-center">감정 분포</h3>
						<div class="flex items-center justify-center h-[300px] bg-surface-200 dark:bg-surface-800 rounded-lg">
							<p class="text-surface-500">커뮤니티 분석 중...</p>
						</div>
					</div>
					<div class="space-y-3">
						<h3 class="font-bold text-center">연령 분포</h3>
						<div class="flex items-center justify-center h-[300px] bg-surface-200 dark:bg-surface-800 rounded-lg">
							<p class="text-surface-500">커뮤니티 분석 중...</p>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<audio bind:this={audioElement} controls class="hidden"></audio>
	</main>
{/if}
