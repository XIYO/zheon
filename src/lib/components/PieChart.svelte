<script lang="ts">
	import { pie, arc } from 'd3-shape';
	import { scaleOrdinal } from 'd3-scale';

	type DataPoint = { label: string; value: number };

	let {
		data,
		innerRadius = 0,
		size = 300
	} = $props<{
		data: DataPoint[];
		innerRadius?: number;
		size?: number;
	}>();

	const ageColorScale = scaleOrdinal<string>()
		.domain(['10대', '20대', '30대', '40대+'])
		.range(['hsl(280, 70%, 60%)', 'hsl(210, 70%, 55%)', 'hsl(160, 60%, 50%)', 'hsl(30, 70%, 55%)']);

	function getColor(label: string): string {
		return ageColorScale(label);
	}
</script>

<div class="relative mx-auto" style:width="{size}px" style:height="{size}px">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<g transform="translate({size / 2}, {size / 2})">
			{#each pie().value((d) => d.value)(data) as slice}
				{@const arcGen = arc()
					.innerRadius(innerRadius * (size / 2))
					.outerRadius(size / 2 - 10)}
				{@const labelRadius = (innerRadius * (size / 2) + (size / 2 - 10)) / 2}
				{@const labelArc = arc().innerRadius(labelRadius).outerRadius(labelRadius)}
				{@const centroid = labelArc.centroid(slice)}
				<path
					d={arcGen(slice)}
					fill={getColor(slice.data.label)}
					stroke="var(--color-surface-950)"
					stroke-width="2"
					class="transition-opacity" />
				<text
					x={centroid[0]}
					y={centroid[1] - 8}
					text-anchor="middle"
					class="text-xs font-semibold fill-current text-surface-950-50">
					{slice.data.label}
				</text>
				<text
					x={centroid[0]}
					y={centroid[1] + 8}
					text-anchor="middle"
					class="text-sm font-bold fill-current text-surface-950-50">
					{slice.data.value}%
				</text>
			{/each}
		</g>
	</svg>
</div>
