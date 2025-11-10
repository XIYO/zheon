import { browser } from '$app/environment';
import { createSummary, getSummaries, getSummaryById } from '$lib/remote/summary.remote';
import { SummarySchema } from '$lib/remote/summary.schema';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext } from 'svelte';

type RemoteQuery = ReturnType<typeof getSummaries>;
type DetailQuery = ReturnType<typeof getSummaryById>;

/**
 * Summary 데이터 통합 관리 스토어
 * - 최신 데이터: 반응형 배열 (옵티미스틱 + Realtime)
 * - 당시 데이터: Remote Function Promise
 * - 모어 데이터: Remote Function Promise 배열
 */
class SummaryStore {
	#supabase: SupabaseClient;
	#initialPagePromise: RemoteQuery | null = null;
	#listQueries = $state<RemoteQuery[]>([]);
	#detailQueries = new Map<string, DetailQuery>();

	constructor(supabase: SupabaseClient) {
		this.#supabase = supabase;

		if (!browser) return;

		const now = new Date().toISOString();
		this.#initialPagePromise = getSummaries({ cursor: now, direction: 'before' });
	}

	/**
	 * 모든 쿼리 배열 (초기 + 추가 페이지)
	 * 각 쿼리는 개별 loading 상태를 가짐
	 */
	get queries() {
		if (!browser || !this.#initialPagePromise) return [];
		return [this.#initialPagePromise, ...this.#listQueries];
	}

	/**
	 * 추가 페이지 로드 (무한 스크롤)
	 * 마지막 쿼리의 nextCursor를 사용하여 다음 페이지 쿼리 생성
	 */
	async loadMore() {
		const lastQuery = this.queries[this.queries.length - 1];
		const lastData = await lastQuery;
		const cursor = lastData?.nextCursor;

		if (!cursor) return;

		const nextQuery = getSummaries({ cursor, direction: 'before' });
		this.#listQueries = [...this.#listQueries, nextQuery];
	}

	detail(id: string): DetailQuery {
		if (this.#detailQueries.has(id)) {
			return this.#detailQueries.get(id)!;
		}
		const query = getSummaryById({ id });
		this.#detailQueries.set(id, query);
		return query;
	}

	/**
	 * Summary 생성 form
	 * 옵티미스틱 업데이트 및 서버 제출만 담당
	 * 이후 실제 데이터는 Realtime INSERT 이벤트로 처리
	 */
	get form() {
		const { id, url } = createSummary.fields;

		const enhancedForm = createSummary.preflight(SummarySchema).enhance(async ({ form, submit }) => {
			const newId = crypto.randomUUID();

			try {
				id.value(newId);

				await submit();

				form.reset();
			} catch (error) {
				console.error('[SummaryStore] 요약 제출 실패:', error);
			}
		});

		return { enhancedForm, fields: { id, url } };
	}

}

/**
 * 타입 안전한 SummaryStore Context
 */
const [getSummaryStore, setSummaryStore] = createContext<SummaryStore>();

export const createSummaryStore = (supabase: SupabaseClient): SummaryStore => {
	const store = new SummaryStore(supabase);
	setSummaryStore(store);
	return store;
};

/**
 * Context에서 SummaryStore 가져오기
 */
export { getSummaryStore };
