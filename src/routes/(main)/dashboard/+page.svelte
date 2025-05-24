<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { handleSignIn } from '$lib/components/Header.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let summaries = $derived(data.summaries);

	let loading = $state(false);

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleEnhance({ formElement, formData, action, cancel, submitter }) {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				handleSignIn();
			} else if (result.type === 'failure') {
				update();
			} else {
				update({ invalidateAll: true });
			}
			loading = false;
		};
	}

	function extractYoutubeId(url) {
		const match = new URL(url).searchParams.get('v');
		return match || '';
	}

	function extractThumbnail(url) {
		const id = extractYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-blue-50 to-gray-100 px-4 py-12"
>
	<div class="mb-8 w-full max-w-md rounded border border-black bg-white p-6 shadow-md">
		<h1 class="mb-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
			유튜브 요약
		</h1>
		<p class="mb-6 text-center text-gray-500">유튜브 영상을 입력하면 AI가 요약해줍니다.</p>

		{#if page.form?.message}
			<div in:slide class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-red-800">{page.form.message}</p>
					</div>
				</div>
			</div>
		{/if}

		<form method="POST" use:enhance={handleEnhance} class="flex flex-col gap-4">
			<input
				name="youtubeUrl"
				placeholder="유튜브 주소를 입력하세요"
				required
				type="text"
				class="w-full border border-black bg-transparent px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-700 focus:outline-none"
				disabled={loading}
			/>
			<button
				class="flex w-full items-center justify-center gap-2 rounded bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-900"
				type="submit"
				disabled={loading}
			>
				{#if loading}
					<svg
						class="h-5 w-5 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
						></path>
					</svg>
					로딩 중...
				{:else}
					요약 요청
				{/if}
			</button>
		</form>
	</div>

	<div class="w-full max-w-6xl">
		{#if summaries?.length === 0}
			<p class="text-center text-gray-400">아직 요약된 영상이 없습니다.</p>
		{:else}
			<h2 class="my-6 text-center text-2xl font-bold text-gray-800">요약 결과</h2>

			<!-- 반응형 그리드: 모바일 1, 태블릿 2, 데스크탑 3~4 -->
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each summaries as summary (summary.id)}
					<a
						href="/summary/{summary.id}/"
						class="flex cursor-pointer flex-col gap-3 rounded border border-black bg-white p-4 shadow-md transition hover:shadow-lg"
					>
						<img
							src={extractThumbnail(summary.youtube_url)}
							alt="썸네일"
							class="aspect-video w-full rounded-xl border border-gray-200 object-cover"
						/>
						<div class="flex flex-col gap-1">
							<div class="truncate text-base font-bold text-gray-900 md:text-lg">
								{summary.title}
							</div>
							<div class="line-clamp-4 text-sm whitespace-pre-line text-gray-700 md:text-base">
								{summary.summary}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
