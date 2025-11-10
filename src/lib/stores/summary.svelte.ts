import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { createSummary, getSummaries, getSummaryById } from '$lib/remote/summary.remote';
import { SummarySchema } from '$lib/remote/summary.schema';
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext } from 'svelte';
import { generateYouTubeUuid } from '$lib/utils/youtube';

type RemoteQuery = ReturnType<typeof getSummaries>;
type DetailQuery = ReturnType<typeof getSummaryById>;

/**
 * Summary 데이터 통합 관리 스토어
 * - 최신 데이터: 반응형 배열 (옵티미스틱 + Realtime)
 * - 당시 데이터: Remote Function Promise
 * - 모어 데이터: Remote Function Promise 배열
 */
class SummaryStore {
	#listQueries = $state<RemoteQuery[]>([]);
	#detailQueries = new Map<string, DetailQuery>();

	constructor() {
		if (!browser) return;

		const now = new Date().toISOString();
		this.#listQueries.push(getSummaries({ cursor: now, direction: 'before' }));
	}

	/**
	 * Realtime 구독 시작
	 * unsubscribe 함수를 반환하여 onMount cleanup에서 사용
	 */
	subscribe(supabase: SupabaseClient<Database>) {
		if (!browser) return () => {};

		console.time('[SummaryStore] Realtime 구독');

		const channel = supabase
			.channel('summary-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'summaries'
				},
				(payload) => {
					console.log('[SummaryStore] Realtime 변경:', payload);
					this.#handleRealtimeChange(payload);
				}
			)
			.subscribe((status) => {
				console.timeEnd('[SummaryStore] Realtime 구독');
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
	 * 모든 쿼리 배열 (초기 + 추가 페이지)
	 * 각 쿼리는 개별 loading 상태를 가짐
	 */
	get queries() {
		if (!browser) return [];
		return this.#listQueries;
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
		const enhancedForm = createSummary.enhance(async ({ form, data, submit }) => {
			try {
				goto(resolve('/(main)/[id]', { id: data.id }));
				await submit();
				form.reset();
			} catch (error) {
				console.error('[SummaryStore] 요약 제출 실패:', error);
			}
		});

		enhancedForm.oninput = function() {
			try {
				console.log('[SummaryStore] oninput 트리거됨');
				const urlInput = this.querySelector('input[name="url"]') as HTMLInputElement;
				const url = urlInput?.value;

				console.log('[SummaryStore] URL 값:', url);

				if (url) {
					const uuid = generateYouTubeUuid(url);
					console.log('[SummaryStore] 생성된 UUID:', uuid);
					createSummary.fields.id.set(uuid);
				}
			} catch (error) {
				console.error('[SummaryStore] UUID 생성 실패:', error);
			}
		};

		return { enhancedForm, fields: createSummary.fields };
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
