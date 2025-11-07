import * as v from 'valibot';

export const CollectCommentsInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	maxBatches: v.optional(v.number(), 5), // 1배치 = 약 20개 댓글, 기본 5배치 = 약 100개
	force: v.optional(v.boolean(), false) // 기본: 증분 수집 (이미 있으면 중지), true: 강제 재수집
});
