<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import PieChart from './PieChart.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();

	const ageColors: Record<string, string> = {
		teens: 'hsl(280, 70%, 60%)',
		twenties: 'hsl(210, 70%, 55%)',
		thirties: 'hsl(160, 60%, 50%)',
		forty_plus: 'hsl(30, 70%, 55%)'
	};
</script>

{#await summaryStore.community(videoId)}
	<div class="space-y-3">
		<h3 class="font-bold text-center">연령 분포</h3>
		<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
			<p class="text-surface-500-400">커뮤니티 분석 중...</p>
		</div>
		<div class="h-16"></div>
	</div>
{:then community}
	{#if community}
		<div class="space-y-3">
			<h3 class="font-bold text-center">연령 분포</h3>
			<div
				class="flex items-center justify-center rounded-lg bg-surface-100-900 transition-all hover:bg-surface-200-800 h-80">
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
	{:else}
		<div class="space-y-3">
			<h3 class="font-bold text-center">연령 분포</h3>
			<div class="card preset-tonal-warning p-8 text-center">
				<p class="text-surface-700-300">댓글이 부족해서 커뮤니티 분석 실패</p>
			</div>
		</div>
	{/if}
{/await}
