<script lang="ts">
	type EmotionData = {
		joy: number;
		trust: number;
		fear: number;
		surprise: number;
		sadness: number;
		disgust: number;
		anger: number;
		anticipation: number;
	};

	let { data, size = 300 } = $props<{
		data: EmotionData;
		size?: number;
	}>();

	const emotions = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
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

	const colorMap: Record<string, string> = {
		joy: 'hsl(45, 100%, 60%)',
		trust: 'hsl(120, 70%, 50%)',
		fear: 'hsl(270, 60%, 60%)',
		surprise: 'hsl(30, 90%, 65%)',
		sadness: 'hsl(210, 60%, 50%)',
		disgust: 'hsl(300, 50%, 50%)',
		anger: 'hsl(0, 70%, 55%)',
		anticipation: 'hsl(180, 50%, 55%)'
	};

	const values = emotions.map((key) => data[key as keyof EmotionData]);
	const angleSlice = (Math.PI * 2) / emotions.length;
	const radius = size / 2 - 40;

	function polarToCartesian(value: number, index: number): { x: number; y: number } {
		const angle = angleSlice * index - Math.PI / 2;
		const r = (value / 100) * radius;
		return {
			x: r * Math.cos(angle),
			y: r * Math.sin(angle)
		};
	}

	const pathData = values
		.map((value, i) => {
			const { x, y } = polarToCartesian(value, i);
			return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
		})
		.join(' ') + ' Z';

	const levels = [20, 40, 60, 80, 100];
</script>

<div class="relative mx-auto" style="width: {size}px; height: {size}px;">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<g transform="translate({size / 2}, {size / 2})">
			{#each levels as level}
				{@const levelPath = emotions
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
					opacity="0.3"
				/>
			{/each}

			{#each emotions as emotion, i}
				{@const { x, y } = polarToCartesian(100, i)}
				<line
					x1="0"
					y1="0"
					x2={x}
					y2={y}
					stroke="var(--color-surface-300)"
					stroke-width="1"
					opacity="0.5"
				/>
				<text
					x={x * 1.15}
					y={y * 1.15}
					text-anchor="middle"
					dominant-baseline="middle"
					class="text-xs fill-surface-600 dark:fill-surface-400"
				>
					{emotionLabels[emotion]}
				</text>
			{/each}

			<path
				d={pathData}
				fill={`${colorMap[emotions[0]]}40`}
				stroke={colorMap[emotions[0]]}
				stroke-width="2"
				class="transition-all"
			/>

			{#each values as value, i}
				{@const { x, y } = polarToCartesian(value, i)}
				<circle
					cx={x}
					cy={y}
					r="4"
					fill={colorMap[emotions[i]]}
					stroke="var(--color-surface-950)"
					stroke-width="1.5"
					class="transition-all"
				/>
			{/each}
		</g>
	</svg>
</div>
