{#snippet article(title, summary, content, metadata = {})}
	<article class="prose prose-lg max-w-none">
		<!-- 헤더 섹션 -->
		<header class="mb-8 pb-8 border-b border-surface-200-800">
			<h1 class="preset-typo-display-1 mb-4">{title}</h1>

			{#if summary}
				<p class="preset-typo-subtitle text-surface-400-600 leading-relaxed">
					{summary}
				</p>
			{/if}

			{#if metadata.date || metadata.author || metadata.readTime}
				<div class="flex gap-4 mt-4 preset-typo-caption text-surface-500">
					{#if metadata.date}
						<time datetime={metadata.date}>
							{new Date(metadata.date).toLocaleDateString('ko-KR')}
						</time>
					{/if}
					{#if metadata.author}
						<span>작성자: {metadata.author}</span>
					{/if}
					{#if metadata.readTime}
						<span>{metadata.readTime}분 읽기</span>
					{/if}
				</div>
			{/if}
		</header>

		<!-- 본문 섹션 -->
		<section class="preset-typo-body-2 space-y-6 leading-relaxed">
			{@html content}
		</section>

		<!-- 푸터 섹션 (선택적) -->
		{#if metadata.tags && metadata.tags.length > 0}
			<footer class="mt-12 pt-8 border-t border-surface-200-800">
				<div class="flex flex-wrap gap-2">
					{#each metadata.tags as tag}
						<span class="badge preset-tonal-surface">
							#{tag}
						</span>
					{/each}
				</div>
			</footer>
		{/if}
	</article>
{/snippet}

{#snippet articleCard(title, summary, url, thumbnail = null)}
	<article class="card preset-filled-surface-100-900 p-6 hover:shadow-lg transition-shadow">
		<a href={url} class="block space-y-4">
			{#if thumbnail}
				<img
					src={thumbnail}
					alt="{title} 썸네일"
					class="w-full aspect-video object-cover rounded-lg" />
			{/if}

			<h3 class="preset-typo-title line-clamp-2">
				{title}
			</h3>

			<p class="preset-typo-body-2 text-surface-400-600 line-clamp-3">
				{summary}
			</p>

			<span class="inline-flex items-center gap-1 preset-typo-caption text-primary-500">
				자세히 보기
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</span>
		</a>
	</article>
{/snippet}

{#snippet articleSection(title, children)}
	<section class="my-8">
		<h2 class="preset-typo-headline mb-4">{title}</h2>
		<div class="preset-typo-body-2 space-y-4">
			{@render children()}
		</div>
	</section>
{/snippet}
