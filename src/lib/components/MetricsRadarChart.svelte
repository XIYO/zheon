<script lang="ts">
	type MetricsData = Record<string, number>;

	let { data, size = 300 } = $props<{
		data: MetricsData;
		size?: number;
	}>();

	const entries = Object.entries(data);
	const keys = entries.map(([key]) => key);
	const values = entries.map(([, value]) => value);

	const angleSlice = (Math.PI * 2) / keys.length;
	const radius = size / 2 - 50;

	function polarToCartesian(value: number, index: number): { x: number; y: number } {
		const angle = angleSlice * index - Math.PI / 2;
		const r = (value / 100) * radius;
		return {
			x: r * Math.cos(angle),
			y: r * Math.sin(angle)
		};
	}

	function getColorForScore(score: number): string {
		if (score >= 70) return 'hsl(142, 70%, 50%)'; // 강점: 초록
		if (score >= 40) return 'hsl(45, 90%, 55%)'; // 보통: 주황
		return 'hsl(0, 70%, 55%)'; // 약점: 빨강
	}

	const pathData =
		values
			.map((value, i) => {
				const { x, y } = polarToCartesian(value, i);
				return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
			})
			.join(' ') + ' Z';

	const levels = [20, 40, 60, 80, 100];
</script>

<div class="relative mx-auto space-y-3" style:width="{size}px">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<g transform="translate({size / 2}, {size / 2})">
			{#each levels as level}
				{@const levelPath =
					keys
						.map((_, i) => {
							const { x, y } = polarToCartesian(level, i);
							return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
						})
						.join(' ') + ' Z'}
				<path
					d={levelPath}
					fill="none"
					stroke="var(--color-surface-300)"
					stroke-width="1"
					opacity="0.3" />
			{/each}

			{#each keys as key, i}
				{@const { x, y } = polarToCartesian(100, i)}
				<line
					x1="0"
					y1="0"
					x2={x}
					y2={y}
					stroke="var(--color-surface-300)"
					stroke-width="1"
					opacity="0.5" />
				<text
					x={x * 1.2}
					y={y * 1.2}
					text-anchor="middle"
					dominant-baseline="middle"
					class="text-xs fill-surface-600-400 font-mono">
					{key}
				</text>
			{/each}

			<path
				d={pathData}
				fill="hsl(200, 70%, 50%, 0.25)"
				stroke="hsl(200, 70%, 50%)"
				stroke-width="2"
				class="transition-all" />

			{#each values as value, i}
				{@const { x, y } = polarToCartesian(value, i)}
				{@const color = getColorForScore(value)}
				<circle
					cx={x}
					cy={y}
					r="5"
					fill={color}
					stroke="white"
					stroke-width="2"
					class="transition-all" />
			{/each}
		</g>
	</svg>

	<!-- 범례 -->
	<div class="flex justify-center gap-4 text-xs">
		<div class="flex items-center gap-1">
			<div class="size-3 rounded-full bg-success-500"></div>
			<span class="text-surface-600-400">강점 (70+)</span>
		</div>
		<div class="flex items-center gap-1">
			<div class="size-3 rounded-full bg-warning-500"></div>
			<span class="text-surface-600-400">보통 (40-69)</span>
		</div>
		<div class="flex items-center gap-1">
			<div class="size-3 rounded-full bg-error-500"></div>
			<span class="text-surface-600-400">약점 (0-39)</span>
		</div>
	</div>
</div>
