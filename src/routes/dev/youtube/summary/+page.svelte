<script>
  import { analyzeVideo, getSummary } from '$lib/remote/youtube/summary.remote.js';
  import { useId } from 'bits-ui';

  let youtubeUrl = $state('');
  let videoId = $state('');
  let analyzing = $state(false);
  let progress = $state(0);
  let summary = $state(null);
  let statusMessage = $state('');
  const youtubeInputId = useId();

  function extractVideoId(url) {
    if (!url) return '';

    if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
      return url;
    }

    try {
      const urlObj = new URL(url);

      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }

      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
    } catch {
      return url;
    }

    return '';
  }

  async function handleAnalyze() {
    const vid = extractVideoId(youtubeUrl);
    if (!vid) {
      alert('올바른 YouTube URL 또는 videoId를 입력하세요');
      return;
    }

    videoId = vid;
    analyzing = true;
    progress = 0;
    summary = null;
    statusMessage = '분석 준비 중...';

    try {
      progress = 10;
      statusMessage = '자막 및 댓글 수집 중...';
      await new Promise(r => setTimeout(r, 100));

      progress = 50;
      statusMessage = 'AI 분석 중...';
      const result = await analyzeVideo({ videoId: vid });

      progress = 90;
      statusMessage = '결과 조회 중...';
      const summaryResult = await getSummary({ videoId: vid });

      if (summaryResult.success) {
        summary = summaryResult.summary;
        progress = 100;
        statusMessage = '분석 완료';
      } else {
        throw new Error(summaryResult.message);
      }
    } catch (err) {
      console.error('[dev/summary] 분석 실패:', err);
      alert('분석 실패: ' + (err.message || '알 수 없는 오류'));
      progress = 0;
      statusMessage = '';
    } finally {
      analyzing = false;
    }
  }
</script>

<main class="container mx-auto px-4 py-8 space-y-6">
  <header>
    <h1 class="h2">YouTube 영상 품질 분석</h1>
    <p class="text-surface-500">
      YouTube URL을 입력하면 자막과 댓글을 분석하여 영상 품질을 평가합니다.
    </p>
  </header>

  <section class="rounded-xl border border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900 space-y-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium" for={youtubeInputId}>YouTube URL 또는 videoId</label>
      <input
        type="text"
        id={youtubeInputId}
        bind:value={youtubeUrl}
        class="input"
        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ 또는 dQw4w9WgXcQ"
        disabled={analyzing}
      />
    </div>

    <button
      class="btn preset-filled-primary w-full"
      onclick={handleAnalyze}
      disabled={analyzing}
    >
      {#if analyzing}
        분석 중... ({Math.round(progress)}%)
      {:else}
        분석 시작
      {/if}
    </button>

    {#if analyzing}
      <div class="space-y-2">
        <div class="w-full h-2 bg-surface-200 rounded-full overflow-hidden dark:bg-surface-700">
          <div
            class="h-full bg-primary-500 transition-all duration-300"
            style="width: {progress}%"
          ></div>
        </div>
        <p class="text-sm text-surface-600 dark:text-surface-400 text-center">
          {statusMessage}
        </p>
      </div>
    {/if}
  </section>

  {#if summary}
    <section class="space-y-6">
      <div class="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="h3 mb-4">콘텐츠 품질</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-3xl font-bold text-primary-500">{summary.content_quality_score}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">종합 점수</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.content_educational_value}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">교육적 가치</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.content_entertainment_value}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">엔터테인먼트</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.content_information_accuracy}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">정보 정확성</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.content_clarity}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">명확성</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.content_depth}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">깊이</div>
          </div>
        </div>
        <div class="mt-4 flex gap-4">
          <div class="flex-1 p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400">카테고리</div>
            <div class="text-sm font-medium mt-1">{summary.content_category || '-'}</div>
          </div>
          <div class="flex-1 p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-xs text-surface-500 dark:text-surface-400">대상 청중</div>
            <div class="text-sm font-medium mt-1">{summary.content_target_audience || '-'}</div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="h3 mb-4">여론 분석</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
              <div class="text-3xl font-bold text-primary-500">{summary.sentiment_overall_score}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">종합 여론 점수</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
              <div class="text-2xl font-semibold">{summary.sentiment_intensity}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">감정 강도</div>
            </div>
          </div>
          <div>
            <div class="text-sm font-medium mb-3 text-center">감정 비율</div>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-xs text-surface-600 dark:text-surface-400 mb-1">
                  <span>긍정</span>
                  <span>{summary.sentiment_positive_ratio}%</span>
                </div>
                <div class="w-full h-6 bg-surface-100 rounded-full overflow-hidden dark:bg-surface-800">
                  <div
                    class="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style="width: {summary.sentiment_positive_ratio}%"
                  >
                    {#if summary.sentiment_positive_ratio > 10}
                      {summary.sentiment_positive_ratio}%
                    {/if}
                  </div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs text-surface-600 dark:text-surface-400 mb-1">
                  <span>중립</span>
                  <span>{summary.sentiment_neutral_ratio}%</span>
                </div>
                <div class="w-full h-6 bg-surface-100 rounded-full overflow-hidden dark:bg-surface-800">
                  <div
                    class="h-full bg-gray-500 flex items-center justify-center text-xs text-white font-medium"
                    style="width: {summary.sentiment_neutral_ratio}%"
                  >
                    {#if summary.sentiment_neutral_ratio > 10}
                      {summary.sentiment_neutral_ratio}%
                    {/if}
                  </div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs text-surface-600 dark:text-surface-400 mb-1">
                  <span>부정</span>
                  <span>{summary.sentiment_negative_ratio}%</span>
                </div>
                <div class="w-full h-6 bg-surface-100 rounded-full overflow-hidden dark:bg-surface-800">
                  <div
                    class="h-full bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                    style="width: {summary.sentiment_negative_ratio}%"
                  >
                    {#if summary.sentiment_negative_ratio > 10}
                      {summary.sentiment_negative_ratio}%
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="h3 mb-4">커뮤니티 품질</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="col-span-2 md:col-span-4 text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-3xl font-bold text-primary-500">{summary.community_quality_score}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">종합 품질 점수</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_politeness}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">예의</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_rudeness}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">저급함</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_kindness}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">상냥함</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_toxicity}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">독성</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_constructive}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">건설성</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_self_centered}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">자기중심</div>
          </div>
          <div class="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div class="text-2xl font-semibold">{summary.community_off_topic}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">헛소리</div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="h3 mb-4">나이대 분포</h2>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium">10대</span>
              <span class="text-surface-600 dark:text-surface-400">{summary.age_group_teens}%</span>
            </div>
            <div class="w-full h-8 bg-surface-100 rounded-lg overflow-hidden dark:bg-surface-800">
              <div
                class="h-full bg-blue-500 flex items-center justify-center text-sm text-white font-medium"
                style="width: {summary.age_group_teens}%"
              >
                {#if summary.age_group_teens > 5}
                  {summary.age_group_teens}%
                {/if}
              </div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium">20대</span>
              <span class="text-surface-600 dark:text-surface-400">{summary.age_group_20s}%</span>
            </div>
            <div class="w-full h-8 bg-surface-100 rounded-lg overflow-hidden dark:bg-surface-800">
              <div
                class="h-full bg-green-500 flex items-center justify-center text-sm text-white font-medium"
                style="width: {summary.age_group_20s}%"
              >
                {#if summary.age_group_20s > 5}
                  {summary.age_group_20s}%
                {/if}
              </div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium">30대</span>
              <span class="text-surface-600 dark:text-surface-400">{summary.age_group_30s}%</span>
            </div>
            <div class="w-full h-8 bg-surface-100 rounded-lg overflow-hidden dark:bg-surface-800">
              <div
                class="h-full bg-yellow-500 flex items-center justify-center text-sm text-white font-medium"
                style="width: {summary.age_group_30s}%"
              >
                {#if summary.age_group_30s > 5}
                  {summary.age_group_30s}%
                {/if}
              </div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium">40대+</span>
              <span class="text-surface-600 dark:text-surface-400">{summary.age_group_40plus}%</span>
            </div>
            <div class="w-full h-8 bg-surface-100 rounded-lg overflow-hidden dark:bg-surface-800">
              <div
                class="h-full bg-purple-500 flex items-center justify-center text-sm text-white font-medium"
                style="width: {summary.age_group_40plus}%"
              >
                {#if summary.age_group_40plus > 5}
                  {summary.age_group_40plus}%
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 class="h3 mb-4">AI 요약</h2>
        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <h3 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">콘텐츠 요약</h3>
            <p class="text-sm text-surface-800 dark:text-surface-100 whitespace-pre-wrap">
              {summary.ai_content_summary || '-'}
            </p>
          </div>
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <h3 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">관객 반응</h3>
            <p class="text-sm text-surface-800 dark:text-surface-100 whitespace-pre-wrap">
              {summary.ai_audience_reaction || '-'}
            </p>
          </div>
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <h3 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">주요 인사이트</h3>
            {#if summary.ai_key_insights && summary.ai_key_insights.length > 0}
              <ul class="list-disc list-inside space-y-1">
                {#each summary.ai_key_insights as insight}
                  <li class="text-sm text-surface-800 dark:text-surface-100">{insight}</li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-surface-600 dark:text-surface-400">-</p>
            {/if}
          </div>
          <div class="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
            <h3 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">개선 권장사항</h3>
            {#if summary.ai_recommendations && summary.ai_recommendations.length > 0}
              <ul class="list-disc list-inside space-y-1">
                {#each summary.ai_recommendations as recommendation}
                  <li class="text-sm text-surface-800 dark:text-surface-100">{recommendation}</li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-surface-600 dark:text-surface-400">-</p>
            {/if}
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-900">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div class="text-surface-500 dark:text-surface-400">분석 일시</div>
            <div class="font-medium mt-1">
              {summary.analyzed_at ? new Date(summary.analyzed_at).toLocaleString('ko-KR') : '-'}
            </div>
          </div>
          <div>
            <div class="text-surface-500 dark:text-surface-400">분석 댓글 수</div>
            <div class="font-medium mt-1">{summary.total_comments_analyzed}개</div>
          </div>
          <div>
            <div class="text-surface-500 dark:text-surface-400">분석 모델</div>
            <div class="font-medium mt-1">{summary.analysis_model}</div>
          </div>
          <div>
            <div class="text-surface-500 dark:text-surface-400">분석 상태</div>
            <div class="font-medium mt-1">{summary.analysis_status}</div>
          </div>
        </div>
      </div>
    </section>
  {/if}
</main>
