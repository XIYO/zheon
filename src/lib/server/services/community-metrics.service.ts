import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import * as v from 'valibot';
import { jsonSchema } from 'ai';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

type CommentData = { content?: { text?: string }; text?: string };

const AgeSchema = {
  type: 'object' as const,
  properties: {
    teens: { type: 'number' as const },
    twenties: { type: 'number' as const },
    thirties: { type: 'number' as const },
    forty_plus: { type: 'number' as const },
    median_age: { type: 'number' as const },
    adult_ratio: { type: 'number' as const }
  },
  required: ['teens', 'twenties', 'thirties', 'forty_plus', 'median_age', 'adult_ratio']
};

const AgeValidation = v.object({
  teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
  twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
  thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
  forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
  median_age: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
  adult_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
});

const EmotionsSchema = {
  type: 'object' as const,
  properties: {
    emotions: {
      type: 'object' as const,
      properties: {
        joy: { type: 'number' as const },
        trust: { type: 'number' as const },
        fear: { type: 'number' as const },
        surprise: { type: 'number' as const },
        sadness: { type: 'number' as const },
        disgust: { type: 'number' as const },
        anger: { type: 'number' as const },
        anticipation: { type: 'number' as const }
      },
      required: [
        'joy',
        'trust',
        'fear',
        'surprise',
        'sadness',
        'disgust',
        'anger',
        'anticipation'
      ]
    },
    vad: {
      type: 'object' as const,
      properties: {
        valence_mean: { type: 'number' as const },
        arousal_mean: { type: 'number' as const }
      },
      required: ['valence_mean', 'arousal_mean']
    },
    dominant_emotion: { type: 'string' as const },
    entropy: { type: 'number' as const }
  },
  required: ['emotions', 'vad', 'dominant_emotion', 'entropy']
};

const EmotionsValidation = v.object({
  emotions: v.object({
    joy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    trust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    fear: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    surprise: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    sadness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    disgust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    anger: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    anticipation: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
  }),
  vad: v.object({
    valence_mean: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
    arousal_mean: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
  }),
  dominant_emotion: v.pipe(
    v.string(),
    v.check((s) =>
      ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'].includes(s)
    )
  ),
  entropy: v.pipe(v.number(), v.minValue(0))
});

export interface AnalyzeCommunityOptions {
  maxBatches?: number;
  force?: boolean; // 현재는 사용하지 않지만 인터페이스 확장 대비
  geminiApiKey: string;
}

export class CommunityMetricsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async analyze(videoId: string, options: AnalyzeCommunityOptions) {
    const { maxBatches = 5, geminiApiKey } = options;
    if (!geminiApiKey) throw error(500, 'GEMINI_API_KEY가 설정되지 않았습니다');

    // 1) 댓글 로드(최대 N*20개)
    const { data: commentRecords, error: commentError } = await this.supabase
      .from('comments')
      .select('data')
      .eq('video_id', videoId)
      .order('updated_at', { ascending: false })
      .limit(maxBatches * 20);

    if (commentError) throw error(500, `댓글 조회 실패: ${commentError.message}`);
    const comments = (commentRecords || [])
      .map((r) => (r.data as CommentData)?.content?.text || (r.data as CommentData)?.text || '')
      .filter((t) => t.length > 0);

    if (comments.length === 0) throw error(400, '분석 가능한 댓글이 없습니다');

    const commentsText = comments
      .slice(0, 200)
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n');

    // 2) 프록시 + 모델 구성(기존 SummaryService와 동일 스타일)
    const socksProxy = env.TOR_SOCKS5_PROXY;
    if (!socksProxy) throw new Error('TOR_SOCKS5_PROXY not configured');

    const proxyAgent = new SocksProxyAgent(socksProxy);
    let requestCounter = 0;
    const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
      const requestId = ++requestCounter;
      const label = `[AI Proxy #${requestId}] ${url}`;
      console.time(label);
      try {
        const response = await fetch(url, {
          ...options,
          // @ts-expect-error Node.js fetch agent support
          agent: proxyAgent
        });
        console.timeEnd(label);
        return response;
      } catch (err) {
        console.timeEnd(label);
        console.error('[AI Proxy] 프록시 fetch 실패:', err);
        throw err;
      }
    };

    const google = createGoogleGenerativeAI({ apiKey: geminiApiKey, fetch: customFetch });
    const model = google('gemini-2.0-flash');

    // 3) Age 추정
    const agePrompt = `당신은 YouTube 커뮤니티 분석가입니다. 아래 댓글 목록을 보고 시청자 연령 분포를 추정하세요.

[댓글 샘플]
${commentsText}

다음 형식의 JSON만 출력하세요(합은 100이 되도록 반올림하되, 마지막 값에서 보정해 일치시켜 주세요):
{
  "teens": 15,
  "twenties": 45,
  "thirties": 25,
  "forty_plus": 15,
  "median_age": 27,
  "adult_ratio": 85
}`;

    const ageResult = await generateObject({
      model,
      schema: jsonSchema(AgeSchema),
      schemaName: 'CommunityAge',
      schemaDescription: 'Age distribution estimation from comments',
      temperature: 0.2,
      maxRetries: 0,
      prompt: agePrompt
    });
    const rawAge = ageResult.object as Record<string, unknown>;
    const ageVal = v.safeParse(AgeValidation, rawAge);
    const age = ageVal.success ? ageVal.output : (rawAge as any);

    // 합 100 정규화
    const ageSum = age.teens + age.twenties + age.thirties + age.forty_plus;
    if (ageSum !== 100) {
      const scale = 100 / (ageSum || 1);
      age.teens = Math.round(age.teens * scale);
      age.twenties = Math.round(age.twenties * scale);
      age.thirties = Math.round(age.thirties * scale);
      age.forty_plus = 100 - age.teens - age.twenties - age.thirties;
    }

    // 4) Emotions(Plutchik 8축 + VAD 요약)
    const emoPrompt = `당신은 유튜브 댓글 감정 분석가입니다. 아래 댓글 목록에서 Plutchik 8가지 기본 감정 분포와 VAD(Valence/Arousal) 요약을 산출하세요.

[댓글 샘플]
${commentsText}

요구사항:
- emotions의 8개 값(joy, trust, fear, surprise, sadness, disgust, anger, anticipation)의 합이 100이 되도록 정규화
- dominant_emotion은 8개 중 가장 높은 감정명으로만 표기
- vad 값은 0-100 스케일의 평균값으로 산출
- entropy는 감정 분포의 샤논 엔트로피(ln 기반)를 계산해 소수점 2자리까지 반올림

JSON만 출력:
{
  "emotions": {
    "joy": 20,
    "trust": 15,
    "fear": 10,
    "surprise": 8,
    "sadness": 12,
    "disgust": 5,
    "anger": 9,
    "anticipation": 21
  },
  "vad": { "valence_mean": 58, "arousal_mean": 52 },
  "dominant_emotion": "anticipation",
  "entropy": 2.10
}`;

    const emoResult = await generateObject({
      model,
      schema: jsonSchema(EmotionsSchema),
      schemaName: 'CommunityEmotions',
      schemaDescription: 'Plutchik distribution and VAD summary from comments',
      temperature: 0.2,
      maxRetries: 0,
      prompt: emoPrompt
    });
    const rawEmo = emoResult.object as Record<string, unknown>;
    const emoVal = v.safeParse(EmotionsValidation, rawEmo);
    const emotions = emoVal.success ? emoVal.output : (rawEmo as any);

    // 합 100 정규화
    const e = emotions.emotions;
    const eSum = e.joy + e.trust + e.fear + e.surprise + e.sadness + e.disgust + e.anger + e.anticipation;
    if (eSum !== 100) {
      const scale = 100 / (eSum || 1);
      e.joy = Math.round(e.joy * scale);
      e.trust = Math.round(e.trust * scale);
      e.fear = Math.round(e.fear * scale);
      e.surprise = Math.round(e.surprise * scale);
      e.sadness = Math.round(e.sadness * scale);
      e.disgust = Math.round(e.disgust * scale);
      e.anger = Math.round(e.anger * scale);
      e.anticipation =
        100 - e.joy - e.trust - e.fear - e.surprise - e.sadness - e.disgust - e.anger;
    }

    // 지배 감정 재산출(안전)
    const entries: Array<[string, number]> = [
      ['joy', e.joy],
      ['trust', e.trust],
      ['fear', e.fear],
      ['surprise', e.surprise],
      ['sadness', e.sadness],
      ['disgust', e.disgust],
      ['anger', e.anger],
      ['anticipation', e.anticipation]
    ];
    entries.sort((a, b) => b[1] - a[1]);
    const dominant = entries[0]?.[0] || 'joy';

    // 5) 저장(Upsert)
    const now = new Date().toISOString();
    const { error: upsertError } = await (this.supabase as any)
      .from('content_community_metrics')
      .upsert(
        {
          video_id: videoId,
          comments_analyzed: Math.min(comments.length, maxBatches * 20),

          age_teens: age.teens,
          age_20s: age.twenties,
          age_30s: age.thirties,
          age_40plus: age.forty_plus,
          age_median: age.median_age,
          age_adult_ratio: age.adult_ratio,

          emotion_joy: e.joy,
          emotion_trust: e.trust,
          emotion_fear: e.fear,
          emotion_surprise: e.surprise,
          emotion_sadness: e.sadness,
          emotion_disgust: e.disgust,
          emotion_anger: e.anger,
          emotion_anticipation: e.anticipation,
          emotion_dominant: dominant,
          emotion_entropy: emotions.entropy,
          valence_mean: emotions.vad.valence_mean,
          arousal_mean: emotions.vad.arousal_mean,

          framework_version: 'v1.0',
          analysis_model: 'gemini-2.0-flash',
          analyzed_at: now,
          updated_at: now
        },
        { onConflict: 'video_id' }
      );

    if (upsertError) throw error(500, `커뮤니티 지표 저장 실패: ${upsertError.message}`);

    return {
      video_id: videoId,
      comments_analyzed: Math.min(comments.length, maxBatches * 20),
      age,
      emotions: { ...emotions, dominant_emotion: dominant }
    };
  }
}
