import { browser } from '$app/environment';
import { createSummary, getSummaries, getSummaryById } from '$lib/remote/summary.remote';
import { SummarySchema } from '$lib/remote/summary.schema';
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext } from 'svelte';
import { generateYouTubeUuid } from '$lib/utils/youtube';

/**
 * Summary 데이터 통합 관리 스토어
 * - 최신 데이터: 반응형 배열 (옵티미스틱 + Realtime)
 * - 당시 데이터: Remote Function Promise
 * - 모어 데이터: Remote Function Promise 배열
 */
class SummaryStore {
	#listQueries = $state([
		getSummaries({ cursor: new Date().toISOString(), direction: 'before' }),
	]);
	#detailQueries = new Map<string, ReturnType<typeof getSummaryById> | Promise<void>>();

	/**
	 * Query 객체 타입 가드
	 */
	#isQueryObject(value: ReturnType<typeof getSummaryById> | Promise<void>): value is ReturnType<typeof getSummaryById> {
		return typeof (value as any).refresh === 'function';
	}

	/**
	 * Realtime 구독 시작
	 * unsubscribe 함수를 반환하여 onMount cleanup에서 사용
	 */
	subscribe(supabase: SupabaseClient<Database>) {
		if (!browser) return () => {};

		const timerId = `[SummaryStore] Realtime 구독 ${Date.now()}`;
		console.time(timerId);

		const channel = supabase
			.channel('summary-changes')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'summaries' },
				(payload) => {
					console.log('[SummaryStore] Realtime 변경:', payload);
					// this.#handleRealtimeChange(payload);
				}
			)
			.subscribe((status) => {
				console.timeEnd(timerId);
				console.log('[SummaryStore] Realtime 구독 상태:', status);
			});

		return () => {
			console.log('[SummaryStore] Realtime 구독 해제');
			supabase.removeChannel(channel);
		};
	}

	/**
	 * Realtime 변경 이벤트 처리
	 */
	#handleRealtimeChange(payload: { eventType: string; new: unknown; old: unknown }) {
		const { eventType, new: newRecord, old: oldRecord } = payload;

		switch (eventType) {
			case 'INSERT':
				console.log('[SummaryStore] 새 요약 추가:', newRecord);
				break;
			case 'UPDATE':
				console.log('[SummaryStore] 요약 업데이트:', newRecord);
				break;
			case 'DELETE':
				console.log('[SummaryStore] 요약 삭제:', oldRecord);
				break;
		}
	}

	/**
	 * 모든 쿼리 배열
	 * 각 쿼리는 개별 loading 상태를 가짐
	 */
	get queries() {
		return browser ? this.#listQueries : [];
	}

	/**
	 * 추가 페이지 로드
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

	/**
	 * Detail 쿼리 조회
	 * - 캐시된 query 있으면 동기 반환
	 * - submit promise 있으면 then으로 query 생성
	 * - 없으면 바로 query 생성
	 */
	detail(id: string) {
		const existing = this.#detailQueries.get(id);

		if (existing && this.#isQueryObject(existing)) {
			return existing;
		}

		const createQuery = () => {
			const query = getSummaryById({ id });
			this.#detailQueries.set(id, query);
			return query;
		};

		return existing ? existing.then(createQuery) : createQuery();
	}

	/**
	 * Summary 생성 form
	 * - 캐시된 query 있으면 submit 건너뛰기
	 * - 없으면 submit하고 promise 저장
	 */
	get form() {
		const enhancedForm = createSummary.preflight(SummarySchema).enhance(async ({ form, data, submit }) => {
			const id = data.id!;
			const existing = this.#detailQueries.get(id);

			if (!existing || !this.#isQueryObject(existing)) {
				this.#detailQueries.set(id, submit());
			}

			// goto(resolve('/(main)/[id]', { id }));
			form.reset();
		});

		return {
			enhancedForm: {
				...enhancedForm,
				oninput: (event: Event) => {
					try {
						const form = event.currentTarget as HTMLFormElement;
						const urlInput = form.elements.namedItem('url') as HTMLInputElement;
						const url = urlInput.value;

						if (url) {
							const uuid = generateYouTubeUuid(url);
							createSummary.fields.id.set(uuid);
						}
					} catch (error) {
						console.error('[SummaryStore] UUID 생성 실패:', error);
					}
				}
			},
			fields: createSummary.fields
		};
	}
}

/**
 * 타입 안전한 SummaryStore Context
 */
const [getSummaryStore, setSummaryStore] = createContext<SummaryStore>();

export const createSummaryStore = (): SummaryStore => {
	const store = new SummaryStore();
	setSummaryStore(store);
	return store;
};

/**
 * Context에서 SummaryStore 가져오기
 */
export { getSummaryStore };
