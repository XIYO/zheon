import { browser } from '$app/environment';
import { createSummary, getSummaries, getSummaryById } from '$lib/remote/summary.remote';
import { SummarySchema } from '$lib/remote/summary.schema';
import { getCategories } from '$lib/remote/categories.remote';
import { getTags } from '$lib/remote/tags.remote';
import { getMetrics } from '$lib/remote/metrics.remote';
import { getCommunityMetrics } from '$lib/remote/community.remote';
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext } from 'svelte';
import { extractVideoId } from '$lib/utils/youtube';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { logger } from '$lib/logger';

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
	#listQueries = $state<QueryInfo[]>(
		!browser && (process.env.DISABLE_REMOTE === '1' || process.env.DISABLE_REMOTE === 'true')
			? []
			: [
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
				]
	);
	#detailQueries = new Map<string, ReturnType<typeof getSummaryById> | Promise<void>>();
	#categoriesQueries = new Map<string, ReturnType<typeof getCategories>>();
	#tagsQueries = new Map<string, ReturnType<typeof getTags>>();
	#metricsQueries = new Map<string, ReturnType<typeof getMetrics>>();
	#communityQueries = new Map<string, ReturnType<typeof getCommunityMetrics>>();

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

		logger.info('[SummaryStore] 변경 감지:', {
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
					logger.info(`[SummaryStore] List 쿼리 리프레시 [${index}]:`, { cursor, direction });
					queryInfo.query.refresh();
				}
			});
		}

		if (changedVideoId && payload.new) {
			const detailQuery = this.#detailQueries.get(changedVideoId);
			if (this.isRemoteQuery(detailQuery)) {
				logger.info(`[SummaryStore] Detail 쿼리 낙관적 업데이트 [${changedVideoId}]:`, {
					title: payload.new.title,
					analysis_status: payload.new.analysis_status,
					summary_audio_status: payload.new.summary_audio_status
				});
				detailQuery.set(payload.new);
			} else {
				logger.info(`[SummaryStore] Detail 쿼리 없음 [${changedVideoId}]`);
			}
		}
	}

	/**
	 * Realtime 구독 시작
	 * unsubscribe 함수를 반환하여 onMount cleanup에서 사용
	 */
	subscribe = (supabase: SupabaseClient<Database>) => {
		if (!browser) {
			logger.warn('[SummaryStore] 브라우저 환경이 아니므로 구독 건너뜀');
			return () => {};
		}

		const startTime = Date.now();
		logger.info('[SummaryStore] Realtime 구독 시작...');

		const channel = supabase
			.channel('summary-changes')
			.on<Database['public']['Tables']['summaries']['Row']>(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'summaries' },
				(payload) => {
					logger.info('[SummaryStore] summaries 변경:', payload);
					this.#handleRealtimeChange({
						eventType: payload.eventType,
						new: payload.new as Database['public']['Tables']['summaries']['Row'] | undefined,
						old: payload.old as { id?: string; created_at?: string; video_id?: string } | undefined
					});
				}
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'content_community_metrics' },
				(payload) => {
					logger.info('[SummaryStore] community 변경:', payload);
					const videoId =
						(payload.new as { video_id?: string })?.video_id ||
						(payload.old as { video_id?: string })?.video_id;
					if (videoId) {
						const communityQuery = this.#communityQueries.get(videoId as string);
						if (communityQuery) {
							logger.info(`[SummaryStore] Community 쿼리 리프레시 [${videoId}]`);
							communityQuery.refresh();
						}
					}
				}
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'video_categories' },
				(payload) => {
					logger.info('[SummaryStore] video_categories 변경:', payload);
					const videoId =
						(payload.new as { video_id?: string })?.video_id ||
						(payload.old as { video_id?: string })?.video_id;
					if (videoId) {
						const categoriesQuery = this.#categoriesQueries.get(videoId as string);
						if (categoriesQuery) {
							logger.info(`[SummaryStore] Categories 쿼리 리프레시 [${videoId}]`);
							categoriesQuery.refresh();
						}
					}
				}
			)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'video_tags' }, (payload) => {
				logger.info('[SummaryStore] video_tags 변경:', payload);
				const videoId =
					(payload.new as { video_id?: string })?.video_id ||
					(payload.old as { video_id?: string })?.video_id;
				if (videoId) {
					const tagsQuery = this.#tagsQueries.get(videoId as string);
					if (tagsQuery) {
						logger.info(`[SummaryStore] Tags 쿼리 리프레시 [${videoId}]`);
						tagsQuery.refresh();
					}
				}
			})
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'content_metrics' },
				(payload) => {
					logger.info('[SummaryStore] content_metrics 변경:', payload);
					const videoId =
						(payload.new as { video_id?: string })?.video_id ||
						(payload.old as { video_id?: string })?.video_id;
					if (videoId) {
						const metricsQuery = this.#metricsQueries.get(videoId as string);
						if (metricsQuery) {
							logger.info(`[SummaryStore] Metrics 쿼리 리프레시 [${videoId}]`);
							metricsQuery.refresh();
						}
					}
				}
			)
			.subscribe((status, err) => {
				logger.info(`[SummaryStore] Realtime 구독 완료: ${Date.now() - startTime}ms`);
				logger.info('[SummaryStore] Realtime 구독 상태:', status);
				if (err) {
					logger.error('[SummaryStore] Realtime 구독 에러:', err);
				}
				if (status !== 'SUBSCRIBED') {
					logger.warn('[SummaryStore] Realtime 구독 실패 - 상태:', status);
				}
			});

		return () => {
			logger.info('[SummaryStore] Realtime 구독 해제');
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

		logger.info('[SummaryStore] loadMore:', {
			totalQueries: this.#listQueries.length,
			lastDataSummaries: lastData?.summaries?.length,
			nextCursor: cursor
		});

		if (!cursor) {
			logger.info('[SummaryStore] loadMore 중단: nextCursor 없음');
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
		logger.info('[SummaryStore] 새 쿼리 추가 완료, 총 쿼리:', this.#listQueries.length);
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
	 * Categories 쿼리 조회
	 * - 캐시된 query 있으면 반환
	 * - 없으면 새로 생성하여 캐시
	 */
	categories(videoId: string) {
		const existing = this.#categoriesQueries.get(videoId);
		if (existing) return existing;

		const query = getCategories({ videoId });
		this.#categoriesQueries.set(videoId, query);
		return query;
	}

	/**
	 * Tags 쿼리 조회
	 * - 캐시된 query 있으면 반환
	 * - 없으면 새로 생성하여 캐시
	 */
	tags(videoId: string) {
		const existing = this.#tagsQueries.get(videoId);
		if (existing) return existing;

		const query = getTags({ videoId });
		this.#tagsQueries.set(videoId, query);
		return query;
	}

	/**
	 * Metrics 쿼리 조회
	 * - 캐시된 query 있으면 반환
	 * - 없으면 새로 생성하여 캐시
	 */
	metrics(videoId: string) {
		const existing = this.#metricsQueries.get(videoId);
		if (existing) return existing;

		const query = getMetrics({ videoId });
		this.#metricsQueries.set(videoId, query);
		return query;
	}

	/**
	 * Community 쿼리 조회
	 * - 캐시된 query 있으면 반환
	 * - 없으면 새로 생성하여 캐시
	 */
	community(videoId: string) {
		const existing = this.#communityQueries.get(videoId);
		if (existing) return existing;

		const query = getCommunityMetrics({ videoId });
		this.#communityQueries.set(videoId, query);
		return query;
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
							if (videoId) {
								createSummary.fields.video_id.set(videoId);
							}
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
