<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import RadarChart from './RadarChart.svelte';
	import PieChart from './PieChart.svelte';
	import MetricsRadarChart from './MetricsRadarChart.svelte';
	import YouTubePlayer from './YouTubePlayer.svelte';

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

	const ageColors: Record<string, string> = {
		teens: 'hsl(280, 70%, 60%)',
		twenties: 'hsl(210, 70%, 55%)',
		thirties: 'hsl(160, 60%, 50%)',
		forty_plus: 'hsl(30, 70%, 55%)'
	};
</script>

<main class="container mx-auto px-4 py-12 max-w-7xl">
	<header>
		<!-- 첫 번째 줄: 영상 + 카테고리/태그 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
			<YouTubePlayer {videoId} />

			<!-- 우: 카테고리, 태그 -->
			<div class="space-y-6">
				<!-- 카테고리 -->
				<div>
					<h3 class="text-sm font-semibold text-surface-600-400 mb-2">카테고리</h3>
					<div class="flex flex-wrap gap-2">
						{#await summaryStore.categories(videoId)}
							<span class="chip preset-filled-primary-500 text-sm animate-pulse">
								<span class="invisible">카테고리 로딩중</span>
							</span>
							<span class="chip preset-filled-primary-500 text-sm animate-pulse">
								<span class="invisible">카테고리 로딩중 텍스트</span>
							</span>
						{:then categories}
							{#if categories && Array.isArray(categories) && categories.length > 0}
								{#each categories as category}
									<span
										class="chip preset-filled-primary-500 text-sm transition-all hover:scale-105">
										{(category as any).name_ko || (category as any).name}
									</span>
								{/each}
							{:else}
								<span class="chip preset-filled-primary-500 text-sm animate-pulse">
									<span class="invisible">카테고리 로딩중</span>
								</span>
								<span class="chip preset-filled-primary-500 text-sm animate-pulse">
									<span class="invisible">카테고리 로딩중 텍스트</span>
								</span>
							{/if}
						{/await}
					</div>
				</div>

				<!-- 태그 -->
				<div>
					<h3 class="text-sm font-semibold text-surface-600-400 mb-2">태그</h3>
					<div class="flex flex-wrap gap-2">
						{#await summaryStore.tags(videoId)}
							<span class="chip preset-tonal-secondary text-sm animate-pulse">
								<span class="invisible">태그 로딩</span>
							</span>
							<span class="chip preset-tonal-secondary text-sm animate-pulse">
								<span class="invisible">태그 로딩중 텍스트</span>
							</span>
							<span class="chip preset-tonal-secondary text-sm animate-pulse">
								<span class="invisible">태그 로딩중</span>
							</span>
						{:then tags}
							{#if tags && tags.length > 0}
								{#each tags as tag}
									<span
										class="chip preset-tonal-secondary text-sm transition-all hover:scale-105"
										style:opacity={tag.weight}>
										{tag.name_ko || tag.name}
									</span>
								{/each}
							{:else}
								<span class="chip preset-tonal-secondary text-sm animate-pulse">
									<span class="invisible">태그 로딩</span>
								</span>
								<span class="chip preset-tonal-secondary text-sm animate-pulse">
									<span class="invisible">태그 로딩중 텍스트</span>
								</span>
								<span class="chip preset-tonal-secondary text-sm animate-pulse">
									<span class="invisible">태그 로딩중</span>
								</span>
							{/if}
						{/await}
					</div>
				</div>
			</div>
		</div>

		<!-- 두 번째 줄: 메트릭 레이더 + 메트릭 설명 -->
		{#await summaryStore.metrics(videoId)}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<!-- 좌: 메트릭 레이더 -->
				<div class="flex items-center justify-center">
					<div>
						<h3 class="text-sm font-semibold text-surface-600-400 mb-4 text-center">
							콘텐츠 특성 분석
						</h3>
						<div class="placeholder-circle animate-pulse bg-surface-200-800 size-80"></div>
					</div>
				</div>

				<!-- 우: 메트릭 설명 -->
				<div class="flex flex-col justify-center">
					<h3 class="text-sm font-semibold text-surface-600-400 mb-4">지표 상세</h3>
					<div class="space-y-3 text-sm">
						{#each Array(4) as _}
							<div class="card preset-tonal-surface p-3">
								<div class="placeholder animate-pulse h-4 w-32 rounded mb-2"></div>
								<div class="placeholder animate-pulse h-3 w-full rounded"></div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:then metrics}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<!-- 좌: 메트릭 레이더 -->
				<div class="flex items-center justify-center">
					<div>
						<h3 class="text-sm font-semibold text-surface-600-400 mb-4 text-center">
							콘텐츠 특성 분석
						</h3>
						{#if metrics && Object.keys(metrics).length > 0}
							<MetricsRadarChart
								data={Object.fromEntries(
									Object.entries(metrics).map(([key, value]) => [
										key,
										typeof value === 'object' && value !== null && 'score' in value
											? (value.score as number)
											: 0
									])
								)} />
						{:else}
							<div class="placeholder-circle animate-pulse bg-surface-200-800 size-80"></div>
						{/if}
					</div>
				</div>

				<!-- 우: 메트릭 설명 -->
				<div class="flex flex-col justify-center">
					<h3 class="text-sm font-semibold text-surface-600-400 mb-4">지표 상세</h3>
					<div class="space-y-3 text-sm">
						{#if metrics && Object.keys(metrics).length > 0}
							{#each Object.entries(metrics) as [key, value]}
								{@const metricValue =
									typeof value === 'object' && value !== null && 'score' in value
										? (value as { score: number; reasoning?: string })
										: { score: 0, reasoning: '' }}
								{@const score = typeof metricValue.score === 'number' ? metricValue.score : 0}
								{@const badgeClass =
									score >= 70
										? 'preset-filled-success'
										: score >= 40
											? 'preset-filled-warning'
											: 'preset-filled-error'}
								{@const category = score >= 70 ? '강점' : score >= 40 ? '보통' : '약점'}
								<div
									class="card preset-tonal-surface p-3 transition-all hover:shadow-md hover:-translate-y-0.5">
									<div class="flex justify-between items-center mb-2">
										<div class="flex items-center gap-2">
											<span class="font-mono font-semibold text-surface-900-50">{key}</span>
											<span class="text-xs text-surface-500">({category})</span>
										</div>
										<span class="badge {badgeClass}">{score}</span>
									</div>
									{#if metricValue.reasoning}
										<p class="text-surface-600-400 text-xs">{metricValue.reasoning}</p>
									{/if}
								</div>
							{/each}
						{:else}
							{#each Array(4) as _}
								<div class="card preset-tonal-surface p-3">
									<div class="placeholder animate-pulse h-4 w-32 rounded mb-2"></div>
									<div class="placeholder animate-pulse h-3 w-full rounded"></div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/await}

		<div class="mt-8 mb-12">
			{#await summaryStore.detail(videoId)}
				<div class="placeholder animate-pulse h-10 rounded w-3/4"></div>
			{:then summary}
				{#if summary.title}
					<h1 class="text-xl font-extrabold mb-2 transition-colors hover:text-primary-600-400">
						{summary.title}
					</h1>
				{:else}
					<div class="placeholder animate-pulse h-10 rounded w-3/4"></div>
				{/if}
			{/await}
		</div>
	</header>

	<section class="card preset-filled-surface-50-900 p-4 transition-all hover:shadow-lg">
		<header class="mb-4">
			<h2 class="h2">AI 요약</h2>
		</header>
		{#await summaryStore.detail(videoId)}
			<div class="space-y-3">
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
			</div>
		{:then summary}
			{#if summary.summary}
				<p class="break-keep">
					{summary.summary}
				</p>
			{:else if summary.analysis_status === 'failed' && summary.failure_reason}
				<div class="card preset-tonal-error p-4">
					<p class="text-sm text-error-700-300">
						{summary.failure_reason}
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					<div class="placeholder animate-pulse h-4 rounded"></div>
					<div class="placeholder animate-pulse h-4 rounded"></div>
					<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
				</div>
			{/if}
		{/await}
	</section>

	<section class="card preset-filled-surface-50-900 p-4 mt-6 transition-all hover:shadow-lg">
		<header class="mb-6">
			<h2 class="h2">커뮤니티 분석</h2>
		</header>

		{#await summaryStore.community(videoId)}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div class="space-y-3">
					<h3 class="font-bold text-center">감정 분포</h3>
					<div class="flex items-center justify-center rounded-lg bg-surface-100-800 h-80">
						<p class="text-surface-500-400">커뮤니티 분석 중...</p>
					</div>
					<div class="h-16"></div>
				</div>
				<div class="space-y-3">
					<h3 class="font-bold text-center">연령 분포</h3>
					<div class="flex items-center justify-center rounded-lg bg-surface-100-800 h-80">
						<p class="text-surface-500-400">커뮤니티 분석 중...</p>
					</div>
					<div class="h-16"></div>
				</div>
			</div>

			<div class="text-xs text-surface-500 mt-6 text-right">
				<div class="h-3"></div>
			</div>
		{:then community}
			{#if community}
				{@const valence = community.valence_mean ?? 0}
				{@const arousal = community.arousal_mean ?? 0}
				{@const valenceLabel = valence > 30 ? '긍정' : valence < -30 ? '부정' : '중립'}
				{@const arousalLabel = arousal > 30 ? '활발' : arousal < -30 ? '차분' : '보통'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<!-- 감정 분포 (Plutchik 8축 레이더) -->
					<div class="space-y-3">
						<h3 class="font-bold text-center">감정 분포</h3>
						<div
							class="flex items-center justify-center rounded-lg bg-surface-100-800 transition-all hover:bg-surface-200-700 h-80">
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

					<!-- 연령 도넛 -->
					<div class="space-y-3">
						<h3 class="font-bold text-center">연령 분포</h3>
						<div
							class="flex items-center justify-center rounded-lg bg-surface-100-800 transition-all hover:bg-surface-200-700 h-80">
							<PieChart
								data={[
									{ label: '10대', value: community.age_teens ?? 0 },
									{ label: '20대', value: community.age_20s ?? 0 },
									{ label: '30대', value: community.age_30s ?? 0 },
									{ label: '40대+', value: community.age_40plus ?? 0 }
								]}
								innerRadius={0.6} />
						</div>
						<div class="h-16">
							<p class="text-sm text-surface-600-400 text-center">
								중앙값 나이: <span class="font-semibold">{community.age_median ?? 0}</span>
								· 성인 비율: {community.age_adult_ratio ?? 0}%
							</p>
						</div>
						{#if community.representative_comments?.age_groups}
							<div class="text-xs text-surface-600-400 mt-4">
								<h4 class="font-semibold mb-2">대표 댓글</h4>
								<div class="space-y-2">
									<div class="py-1 pl-3 border-l-2" style:border-color={ageColors.teens}>
										<span class="font-semibold">10대:</span>
										{#if community.representative_comments.age_groups.teens === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">
												"{community.representative_comments.age_groups.teens}"
											</p>
										{/if}
									</div>
									<div class="py-1 pl-3 border-l-2" style:border-color={ageColors.twenties}>
										<span class="font-semibold">20대:</span>
										{#if community.representative_comments.age_groups.twenties === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">
												"{community.representative_comments.age_groups.twenties}"
											</p>
										{/if}
									</div>
									<div class="py-1 pl-3 border-l-2" style:border-color={ageColors.thirties}>
										<span class="font-semibold">30대:</span>
										{#if community.representative_comments.age_groups.thirties === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">
												"{community.representative_comments.age_groups.thirties}"
											</p>
										{/if}
									</div>
									<div class="py-1 pl-3 border-l-2" style:border-color={ageColors.forty_plus}>
										<span class="font-semibold">40대+:</span>
										{#if community.representative_comments.age_groups.forty_plus === '-'}
											<p class="text-surface-400-600 mt-0.5">-</p>
										{:else}
											<p class="italic text-surface-700-300 mt-0.5">
												"{community.representative_comments.age_groups.forty_plus}"
											</p>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="text-xs text-surface-500 mt-6 text-right">
					최근 댓글 {community.comments_analyzed ?? 0}개 분석 · {community.analysis_model}
				</div>
			{:else}
				<div class="card preset-tonal-warning p-8 text-center">
					<p class="text-surface-700-300">댓글이 부족해서 커뮤니티 분석 실패</p>
				</div>
			{/if}
		{/await}
	</section>
</main>
