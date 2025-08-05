/**
 * Video Processing Pipeline - 체이닝 구조
 * 
 * YouTube URL → 자막 추출 → DB 저장 → 요약 (향후)
 */

import { extractYouTubeSubtitles, YouTubeExtractionResult } from "./youtube-extractor.ts";
import { createSupabaseClient } from "./supabase-client.ts";

export interface ProcessingStep {
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  data?: unknown;
  error?: string;
  timestamp: string;
}

export interface VideoProcessingResult {
  success: boolean;
  youtube_url: string;
  video_id?: string;
  steps: ProcessingStep[];
  final_data?: any;
  error?: string;
}

// 체이닝용 데이터 인터페이스
export interface ExtractionChainData {
  youtube_url: string;
  transcript: string;
  transcript_length: number;
  cached: boolean;
  step: string;
}

export interface DatabaseChainData extends ExtractionChainData {
  record_id: string;
  saved_at: string;
}

export interface SummaryChainData extends DatabaseChainData {
  summary?: string;
  summary_generated: boolean;
}

/**
 * 체이닝 Step 1: YouTube 자막 추출
 * @param youtubeUrl YouTube URL
 * @returns Promise<ExtractionResult> 다음 단계로 전달할 데이터
 */
function extractSubtitles(youtubeUrl: string, result: VideoProcessingResult): Promise<ExtractionChainData> {
  console.log(`[Chain 1] 🎬 Extracting subtitles from: ${youtubeUrl}`);
  
  return extractYouTubeSubtitles(youtubeUrl)
    .then(extraction => {
      if (!extraction.success) {
        throw new Error(extraction.error || "Subtitle extraction failed");
      }
      
      const chainData: ExtractionChainData = {
        youtube_url: youtubeUrl,
        transcript: extraction.transcript!,
        transcript_length: extraction.transcript?.length || 0,
        cached: extraction.cached || false,
        step: "extract_subtitles"
      };
      
      // result에 진행 상황 기록
      result.steps.push({
        step: "extract_subtitles",
        status: "completed", 
        timestamp: new Date().toISOString(),
        data: {
          transcript_length: chainData.transcript_length,
          cached: chainData.cached
        }
      });
      
      console.log(`[Chain 1] ✅ Extracted ${chainData.transcript_length} chars`);
      return chainData;
    });
}

/**
 * 체이닝 Step 2: 데이터베이스에 저장
 * @param extractionData 이전 단계에서 전달받은 자막 데이터
 * @returns Promise<DatabaseChainData> 다음 단계로 전달할 데이터
 */
function saveToDatabase(extractionData: ExtractionChainData, result: VideoProcessingResult): Promise<DatabaseChainData> {
  console.log(`[Chain 2] 💾 Saving to database...`);
  
  const supabase = createSupabaseClient();
  
  return supabase
    .from("subtitles")
    .insert({
      youtube_url: extractionData.youtube_url,
      content: extractionData.transcript,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      const chainData: DatabaseChainData = {
        ...extractionData,
        record_id: data.id,
        saved_at: data.created_at,
        step: "save_to_database"
      };
      
      // result에 진행 상황 기록
      result.video_id = data.id;
      result.steps.push({
        step: "save_to_database",
        status: "completed",
        timestamp: new Date().toISOString(),
        data: { record_id: data.id, table: "subtitles" }
      });
      
      console.log(`[Chain 2] ✅ Saved with ID: ${data.id}`);
      return chainData;
    });
}

/**
 * 체이닝 Step 3: 요약 생성 (LangChain 향후 구현)
 * @param databaseData 이전 단계에서 전달받은 DB 저장 데이터
 * @returns Promise<SummaryChainData> 최종 결과 데이터
 */
function generateSummary(databaseData: DatabaseChainData, result: VideoProcessingResult): Promise<SummaryChainData> {
  console.log(`[Chain 3] 🤖 Generating summary... (placeholder)`);
  
  // TODO: 향후 LangChain + 웹 조사 통합
  // return langChainSummary(databaseData.transcript)
  //   .then(summary => webResearch(summary))
  //   .then(enhancedSummary => ({ ...databaseData, summary: enhancedSummary }));
  
  return Promise.resolve().then(() => {
    const chainData: SummaryChainData = {
      ...databaseData,
      summary: `[미구현] ${databaseData.transcript.substring(0, 100)}... 요약 예정`,
      summary_generated: false,
      step: "generate_summary"
    };
    
    // result에 진행 상황 기록
    result.steps.push({
      step: "generate_summary", 
      status: "completed",
      timestamp: new Date().toISOString(),
      data: { 
        summary_method: "langchain_web_research", 
        status: "not_implemented" 
      }
    });
    
    console.log(`[Chain 3] ⏳ Summary placeholder completed`);
    return chainData;
  });
}

/**
 * 진짜 체이닝 파이프라인 - Promise 체이닝 방식
 * 각 단계가 다음 단계로 결과를 전달하는 구조
 */
export function processYouTubeVideo(youtubeUrl: string): Promise<VideoProcessingResult> {
  const result: VideoProcessingResult = {
    success: false,
    youtube_url: youtubeUrl,
    steps: [],
  };

  console.log(`🚀 Starting chaining pipeline for: ${youtubeUrl}`);

  // 진짜 체이닝: extractSubtitles -> saveToDatabase -> generateSummary
  return extractSubtitles(youtubeUrl, result)
    .then(extractionData => saveToDatabase(extractionData, result))
    .then(databaseData => generateSummary(databaseData, result))
    .then(finalData => {
      result.success = true;
      result.final_data = finalData;
      console.log(`✅ Promise chaining pipeline completed for: ${youtubeUrl}`);
      return result;
    })
    .catch(error => {
      result.success = false;
      result.error = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Promise chaining pipeline failed:`, error);
      return result;
    });
}