import { browser } from '$app/environment';
import { createSummary, getSummaries, getSummaryById } from '$lib/remote/summary.remote';
import { SummarySchema } from '$lib/remote/summary.schema';
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext } from 'svelte';
import { extractVideoId } from '$lib/utils/youtube';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

/**
 * List 쿼리 정보
 */
interface QueryInfo {
	query: ReturnType<typeof getSummaries>;
	cursor: string;
	direction: 'before' | 'after';
}

/**
 * Summary 데이터 통합 관리 스토어
 */
class SummaryStore {
	#listQueries = $state<QueryInfo[]>([
		{
			query: getSummaries({ cursor: new Date().toISOString(), direction: 'after', limit: 0 }),
			cursor: new Date().toISOString(),
			direction: 'after'
		},
		{
			query: getSummaries({ cursor: new Date().toISOString(), direction: 'before' }),
			cursor: new Date().toISOString(),
			direction: 'before'
		}
	]);
	#detailQueries = new Map<string, ReturnType<typeof getSummaryById> | Promise<void>>();

	/**
	 * RemoteQuery 타입 가드
	 * refresh는 RemoteQuery의 공개 API 메서드
	 * RemoteQuery는 클래스지만 export되지 않아서 instanceof 비교 불가
	 * 따라서 공개 메서드 존재 여부로 타입 가드
	 */
	isRemoteQuery(
		value: ReturnType<typeof getSummaryById> | Promise<void> | undefined
	): value is ReturnType<typeof getSummaryById> {
		return value != null && 'refresh' in value;
	}

	/**
	 * Realtime 변경사항 처리
	 * - 변경된 데이터의 created_at을 확인하여 해당 범위의 list 쿼리만 리프레시
	 * - 변경된 데이터의 video_id로 detail 쿼리 낙관적 업데이트 (리프레시 X, UX 개선)
	 */
	#handleRealtimeChange(payload: {
		eventType: string;
		new?: Database['public']['Tables']['summaries']['Row'];
		old?: { id?: string; created_at?: string; video_id?: string };
	}) {
		const changedVideoId = payload.new?.video_id || payload.old?.video_id;
		const changedDate = payload.new?.created_at || payload.old?.created_at;

		console.log('[SummaryStore] 변경 감지:', {
			event: payload.eventType,
			changedVideoId,
			changedDate
		});

		if (changedDate) {
			this.#listQueries.forEach((queryInfo, index) => {
				const { cursor, direction } = queryInfo;
				const shouldRefresh =
					(direction === 'after' && changedDate >= cursor) ||
					(direction === 'before' && changedDate <= cursor);

				if (shouldRefresh) {
					console.log(`[SummaryStore] List 쿼리 리프레시 [${index}]:`, { cursor, direction });
					queryInfo.query.refresh();
				}
			});
		}

		if (changedVideoId && payload.new) {
			const detailQuery = this.#detailQueries.get(changedVideoId);
			if (this.isRemoteQuery(detailQuery)) {
				console.log(`[SummaryStore] Detail 쿼리 낙관적 업데이트 [${changedVideoId}]:`, {
					title: payload.new.title,
					analysis_status: payload.new.analysis_status,
					summary_audio_status: payload.new.summary_audio_status
				});
				detailQuery.set(payload.new);
			} else {
				console.log(`[SummaryStore] Detail 쿼리 없음 [${changedVideoId}]`);
			}
		}
	}

	/**
	 * Realtime 구독 시작
	 * unsubscribe 함수를 반환하여 onMount cleanup에서 사용
	 */
	subscribe = (supabase: SupabaseClient<Database>) => {
		if (!browser) return () => {};

		const timerId = `[SummaryStore] Realtime 구독 ${Date.now()}`;
		console.time(timerId);

		const channel = supabase
			.channel('summary-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'summaries' }, (payload) => {
				console.log('[SummaryStore] summaries 변경:', payload);
				this.#handleRealtimeChange(payload);
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'content_community_metrics' }, (payload) => {
				console.log('[SummaryStore] community 변경:', payload);
				const videoId = (payload.new as any)?.video_id || (payload.old as any)?.video_id;
				if (videoId) {
					const detailQuery = this.#detailQueries.get(videoId as string);
					if (this.isRemoteQuery(detailQuery)) {
						detailQuery.refresh();
					}
				}
			})
			.subscribe((status) => {
				console.timeEnd(timerId);
				console.log('[SummaryStore] Realtime 구독 상태:', status);
			});

		return () => {
			console.log('[SummaryStore] Realtime 구독 해제');
			supabase.removeChannel(channel);
		};
	};

	/**
	 * 모든 쿼리 배열
	 * 각 쿼리는 개별 loading 상태를 가짐
	 */
	get listQueries() {
		return browser ? this.#listQueries.map((info) => info.query) : [];
	}

	/**
	 * 추가 페이지 로드
	 * 마지막 쿼리의 nextCursor를 사용하여 다음 페이지 쿼리 생성
	 */
	async loadMore() {
		const lastQueryInfo = this.#listQueries[this.#listQueries.length - 1];
		const lastData = await lastQueryInfo.query;
		const cursor = lastData?.nextCursor;

		console.log('[SummaryStore] loadMore:', {
			totalQueries: this.#listQueries.length,
			lastDataSummaries: lastData?.summaries?.length,
			nextCursor: cursor
		});

		if (!cursor) {
			console.log('[SummaryStore] loadMore 중단: nextCursor 없음');
			return;
		}

		this.#listQueries = [
			...this.#listQueries,
			{
				query: getSummaries({ cursor, direction: 'before' }),
				cursor,
				direction: 'before'
			}
		];
		console.log('[SummaryStore] 새 쿼리 추가 완료, 총 쿼리:', this.#listQueries.length);
	}

	/**
	 * Detail 쿼리 조회
	 * - 캐시된 query 있으면 동기 반환
	 * - submit promise 있으면 then으로 query 생성
	 * - 없으면 바로 query 생성
	 */
	detail(videoId: string) {
		const existing = this.#detailQueries.get(videoId);

		if (this.isRemoteQuery(existing)) {
			return existing;
		}

		const createQuery = () => {
			const query = getSummaryById({ id: videoId });
			this.#detailQueries.set(videoId, query);
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
		const enhancedForm = createSummary
			.preflight(SummarySchema)
			.enhance(async ({ form, data, submit }) => {
				const videoId = data.video_id;

				if (!this.isRemoteQuery(this.#detailQueries.get(videoId)))
					this.#detailQueries.set(videoId, submit());
				else submit();

				goto(resolve('/(main)/[videoId]', { videoId }));
				form.reset();
			});

		return {
			enhancedForm: {
				...enhancedForm,
				oninput: (event: Event) => {
					const form = event.currentTarget as HTMLFormElement;
					const urlInput = form.elements.namedItem('url') as HTMLInputElement;
					const url = urlInput.value;

					if (url) {
						try {
							const videoId = extractVideoId(url);
							createSummary.fields.video_id.set(videoId);
						} catch {
							// URL이 아직 완전하지 않을 수 있음
						}
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
