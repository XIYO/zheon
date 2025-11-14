<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import RadarChart from './RadarChart.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();

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
</script>

{#await summaryStore.community(videoId)}
	<div class="space-y-3">
		<h3 class="font-bold text-center">감정 분포</h3>
		<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
			<p class="text-surface-500-400">커뮤니티 분석 중...</p>
		</div>
		<div class="h-16"></div>
	</div>
{:then community}
	{#if community}
		{@const emotionSum =
			(community.emotion_joy ?? 0) +
			(community.emotion_trust ?? 0) +
			(community.emotion_fear ?? 0) +
			(community.emotion_surprise ?? 0) +
			(community.emotion_sadness ?? 0) +
			(community.emotion_disgust ?? 0) +
			(community.emotion_anger ?? 0) +
			(community.emotion_anticipation ?? 0)}
		{@const isValidData = emotionSum > 0}
		{@const valence = community.valence_mean ?? 0}
		{@const arousal = community.arousal_mean ?? 0}
		{@const valenceLabel = valence > 30 ? '긍정' : valence < -30 ? '부정' : '중립'}
		{@const arousalLabel = arousal > 30 ? '활발' : arousal < -30 ? '차분' : '보통'}
		{#if !isValidData}
			<div class="space-y-3">
				<h3 class="font-bold text-center">감정 분포</h3>
				<div class="card preset-tonal-warning p-8 text-center">
					<p class="text-surface-700-300">댓글이 부족해서 커뮤니티 분석 실패</p>
				</div>
			</div>
		{:else}
		<div class="space-y-3">
			<h3 class="font-bold text-center">감정 분포</h3>
			<div
				class="flex items-center justify-center rounded-lg bg-surface-100-900 transition-all hover:bg-surface-200-800 h-80">
				<RadarChart
					data={{
						joy: community.emotion_joy ?? 0,
						trust: community.emotion_trust ?? 0,
						fear: community.emotion_fear ?? 0,
						surprise: community.emotion_surprise ?? 0,
						sadness: community.emotion_sadness ?? 0,
						disgust: community.emotion_disgust ?? 0,
						anger: community.emotion_anger ?? 0,
						anticipation: community.emotion_anticipation ?? 0
					}} />
			</div>
			<div class="h-16">
				<p class="text-sm text-surface-600-400 text-center">
					주요 감정: <span class="font-semibold">
						{emotionLabels[community.emotion_dominant ?? 'joy'] ?? community.emotion_dominant}
					</span>
					· 긍정도
					<span
						class="font-semibold"
						class:text-success-600-400={valence > 30}
						class:text-error-600-400={valence < -30}>
						{valence > 0 ? '+' : ''}{valence} ({valenceLabel})
					</span>
					· 활성도
					<span
						class="font-semibold"
						class:text-primary-600-400={arousal > 30}
						class:text-surface-500={arousal >= -30 && arousal <= 30}>
						{arousal > 0 ? '+' : ''}{arousal} ({arousalLabel})
					</span>
				</p>
			</div>
			{#if community.representative_comments?.emotions}
				<div class="text-xs text-surface-600-400 mt-4">
					<h4 class="font-semibold mb-2">대표 댓글</h4>
					<div class="space-y-2">
						{#each Object.entries(community.representative_comments.emotions) as [emotion, comment]}
							<div class="py-1 pl-3 border-l-2" style:border-color={emotionColors[emotion]}>
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
		{/if}
	{:else}
		<div class="space-y-3">
			<h3 class="font-bold text-center">감정 분포</h3>
			<div class="card preset-tonal-warning p-8 text-center">
				<p class="text-surface-700-300">댓글이 부족해서 커뮤니티 분석 실패</p>
			</div>
		</div>
	{/if}
{/await}
