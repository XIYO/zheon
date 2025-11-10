import { getSummaryById, getSummaries, createSummary } from '$lib/remote/summary.remote';
import { SummarySchema } from '$lib/remote/summary.schema';
import { untrack } from 'svelte';
import { browser } from '$app/environment';
import { createContext } from 'svelte';

/**
 * Summary 데이터 통합 관리 스토어
 * - 최신 데이터: 반응형 배열 (옵티미스틱 + Realtime)
 * - 당시 데이터: Remote Function Promise
 * - 모어 데이터: Remote Function Promise 배열
 */
class SummaryStore {
	/** Supabase 클라이언트 */
	#supabase;

	/** 최신 데이터 (반응형) - 옵티미스틱 + Realtime INSERT/UPDATE */
	#latestItems = $state([]);

	/** 당시 데이터 - getSummaries({ cursor: now, direction: 'before' }) Promise */
	#initialPagePromise = null;

	/** 초기 로드 시점 타임스탬프 */
	#initialLoadTimestamp = null;

	/** 모어 데이터 - getSummaries({ cursor }) Promise 배열 */
	#additionalPages = [];

	/** 초기 로딩 완료 플래그 */
	#isInitialLoaded = $state(false);

	/** 캐시된 데이터 (백그라운드 리프레시용) */
	#cachedData = $state([]);

	/** 모든 페이지 쿼리 배열 */
	#queries = $state([]);

	/** Realtime 이벤트 버퍼 (초기 로딩 중 이벤트 저장, id → payload) */
	#realtimeBuffer = new Map();

	/** Realtime 채널 관리 */
	#detailChannels = new Map();
	#listChannel = null;

	/**
	 * Supabase 클라이언트 주입 및 초기화
	 * @param {any} supabase - Supabase 클라이언트
	 */
	constructor(supabase) {
		this.#supabase = supabase;

		if (!browser) return;

		this.loadInitialPage();

		$effect(() => {
			if (this.#initialPagePromise.ready) {
				this.#flushRealtimeBuffer();
			}
		});
	}

	/**
	 * 개별 Summary 데이터 조회
	 * @param {string} id - Summary ID
	 * @returns {Promise<any>} Summary 데이터 Promise
	 */
	detail(id) {
		return getSummaryById({ id });
	}

	/**
	 * 모든 페이지 쿼리 배열 반환
	 * 각 쿼리는 개별 loading 상태를 가짐
	 * current 속성을 사용하면 refresh 중에도 이전 데이터 유지
	 */
	get queries() {
		if (!browser || !this.#initialPagePromise) return [];
		return [this.#initialPagePromise, ...this.#queries];
	}

	/**
	 * 모든 해결된 데이터 병합
	 * 각 쿼리의 current를 사용하여 깜빡임 방지
	 * RemoteQuery의 current는 이미 $derived이므로 자동 반응형
	 */
	get allSummaries() {
		if (!browser) return [];
		return this.queries
			.map((q) => q.current?.summaries || [])
			.flat();
	}

	/**
	 * 새로운 데이터 로딩 중 여부
	 * 최초 로딩이거나, 마지막 쿼리가 로딩 중일 때만 true
	 * RemoteQuery의 loading은 이미 $state이므로 자동 반응형
	 */
	get isLoadingMore() {
		if (!browser) return false;
		const lastQuery = this.#queries[this.#queries.length - 1];
		return lastQuery ? lastQuery.loading && !lastQuery.current : false;
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
				const newUrl = url.value();

				const optimisticSummary = {
					id: newId,
					url: newUrl,
					title: null,
					summary: null,
					processing_status: 'pending',
					thumbnail_url: null,
					updated_at: new Date().toISOString()
				};

				this.addOptimistic(optimisticSummary);

				id.value(newId);

				await submit();

				form.reset();
			} catch (error) {
				console.error('[SummaryStore] 요약 제출 실패:', error);
				this.removeOptimistic(newId);
			}
		});

		return { enhancedForm, fields: { id, url } };
	}

	/**
	 * 초기 페이지 로드
	 * 현재 시간을 커서로 과거 데이터 조회
	 */
	loadInitialPage() {
		const now = new Date().toISOString();
		this.#initialPagePromise = getSummaries({ cursor: now, direction: 'before' });
	}

	/**
	 * 추가 페이지 로드 (무한 스크롤)
	 * 마지막 쿼리의 nextCursor를 사용하여 다음 페이지 쿼리 생성
	 */
	async loadMore() {
		const lastQuery = this.#queries.length > 0 ? this.#queries[this.#queries.length - 1] : this.#initialPagePromise;
		const lastData = await lastQuery;
		const cursor = lastData?.nextCursor;

		if (!cursor) return;

		const nextQuery = getSummaries({ cursor, direction: 'before' });
		this.#queries = [...this.#queries, nextQuery];
	}

	/**
	 * Realtime 이벤트 처리
	 * @param {any} payload - Realtime payload
	 */
	handleRealtimeEvent(payload) {
		const recordId = payload.new?.id;
		if (!recordId) return;

		if (!this.#initialPagePromise.ready) {
			this.#realtimeBuffer.set(recordId, payload);
		} else {
			this.#applyRealtimeUpdate(payload);
		}
	}

	/**
	 * 버퍼에 저장된 Realtime 이벤트 적용
	 */
	#flushRealtimeBuffer() {
		if (this.#realtimeBuffer.size === 0) return;

		console.log(`[SummaryStore] Flushing ${this.#realtimeBuffer.size} buffered events`);
		this.#realtimeBuffer.forEach((payload) => this.#applyRealtimeUpdate(payload));
		this.#realtimeBuffer.clear();
	}

	/**
	 * Realtime 업데이트를 쿼리에 적용
	 * @param {any} payload - Realtime payload
	 */
	#applyRealtimeUpdate(payload) {
		const { eventType, new: newRecord } = payload;
		if (!newRecord) return;

		this.queries.forEach((query) => {
			if (!query.ready) return;

			const current = query.current;
			if (!current?.summaries) return;

			let updated = false;
			const newSummaries = current.summaries.map((s) => {
				if (s.id === newRecord.id) {
					updated = true;
					return { ...s, ...newRecord };
				}
				return s;
			});

			if (eventType === 'INSERT' && !updated) {
				newSummaries.unshift(newRecord);
				updated = true;
			}

			if (updated) {
				query.set({ ...current, summaries: newSummaries });
			}
		});
	}
}

/**
 * 타입 안전한 SummaryStore Context
 */
const [getSummaryStore, setSummaryStore] = createContext();

/**
 * SummaryStore 인스턴스 생성 및 Context 설정
 * @param {any} supabase - Supabase 클라이언트
 * @returns {SummaryStore} SummaryStore 인스턴스
 */
export const createSummaryStore = (supabase) => {
	const store = new SummaryStore(supabase);
	setSummaryStore(store);
	return store;
};

/**
 * Context에서 SummaryStore 가져오기
 */
export { getSummaryStore };
