<script>
	import { createSummary, getSummaries } from '$lib/remote/summary.remote.ts';
	import { SummarySchema } from '$lib/remote/summary.schema';

	const { id, url } = createSummary.fields;

	const enhancedForm = createSummary.preflight(SummarySchema).enhance(async ({ form, submit }) => {
		try {
			console.log('[SummaryForm] 제출 시작, URL:', url.value());

			const newUrl = url.value();

			// 중복 URL 체크: 정규화된 URL로 비교
			const current = await getSummaries({});

			// URL을 정규화하여 비교 (대소문자, 쿼리 파라미터 등 통일)
			const normalizeUrlForComparison = (url) => {
				try {
					const urlObj = new URL(url);
					return urlObj.href.toLowerCase();
				} catch {
					return url.toLowerCase();
				}
			};

			const normalizedNewUrl = normalizeUrlForComparison(newUrl);
			const isDuplicate = current.summaries.some(
				(s) => normalizeUrlForComparison(s.url) === normalizedNewUrl
			);

			if (isDuplicate) {
				console.log('[SummaryForm] 중복 URL 감지:', newUrl);
				form.reset();
				return;
			}

			// 낙관적 업데이트
			const newId = crypto.randomUUID();
			const optimisticSummary = {
				id: newId,
				url: newUrl,
				title: null,
				summary: null,
				processing_status: 'pending',
				thumbnail_url: null,
				updated_at: null
			};

			getSummaries({}).set({
				...current,
				summaries: [optimisticSummary, ...current.summaries]
			});
			console.log('[SummaryForm] 낙관적 업데이트:', optimisticSummary);

			// form에 ID 추가
			id.value(newId);

			// 서버 제출 (form은 반환값 없음)
			await submit();
			console.log('[SummaryForm] 서버 제출 완료');

			// 서버에서 데이터 다시 가져오기
			const updated = await getSummaries({});
			getSummaries({}).set(updated);
			console.log('[SummaryForm] 서버 데이터 리프레시 완료');

			form.reset();
			console.log('[SummaryForm] 제출 완료');
		} catch (error) {
			console.error('[SummaryForm] 요약 제출 실패:', error);
			console.error(
				'[SummaryForm] 에러 타입:',
				typeof error,
				Object.prototype.toString.call(error)
			);
			console.error('[SummaryForm] 에러 키:', Object.keys(error));
			if (error?.body) console.error('[SummaryForm] 에러 body:', error.body);
			if (error?.status) console.error('[SummaryForm] 에러 status:', error.status);
			if (error?.message) console.error('[SummaryForm] 에러 message:', error.message);

			// 실패 시 낙관적 항목 롤백
			const current = await getSummaries({});
			const rollback = current.summaries.filter((s) => s.url !== url.value());

			getSummaries({}).set({
				...current,
				summaries: rollback
			});
			console.log('[SummaryForm] 롤백 완료');
		}
	});
</script>

<form {...enhancedForm} novalidate class="flex gap-2">
	<div class="flex-1">
		<input {...url.as('text')} placeholder="YouTube URL을 입력하세요" class="input" />
		{#each url.issues() as issue (issue.message)}
			<p class="mt-1 text-xs text-error-500">{issue.message}</p>
		{/each}
	</div>
	<button type="submit" class="btn preset-filled-primary whitespace-nowrap">생성</button>
</form>
