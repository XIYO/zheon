import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsValidation, corsResponse, corsError } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

/**
 * 기존 subtitles 테이블의 데이터를 정규화하는 Edge Function
 * 
 * 작업 내용:
 * 1. 정규화가 필요한 URL 식별
 * 2. URL 정규화 적용
 * 3. 중복 데이터 병합 및 정리
 * 4. 통계 정보 반환
 */

/**
 * YouTube URL을 정규화하여 표준 형태로 변환
 */
function normalizeYouTubeUrl(url: string): string {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }
  
  // YouTube 도메인 검증
  const youtubePatterns = [
    /^(www\.)?youtube\.com$/,
    /^(www\.)?youtu\.be$/,
    /^m\.youtube\.com$/,
    /^music\.youtube\.com$/
  ];
  
  const isYouTube = youtubePatterns.some(pattern => 
    pattern.test(parsedUrl.hostname)
  );
  
  if (!isYouTube) {
    throw new Error(`Not a YouTube URL: ${parsedUrl.hostname}`);
  }
  
  let videoId: string | null = null;
  
  // Video ID 추출 로직
  if (parsedUrl.hostname.includes('youtube.com')) {
    // 1. youtube.com/watch?v=VIDEO_ID
    if (parsedUrl.pathname === '/watch') {
      videoId = parsedUrl.searchParams.get('v');
    }
    // 2. youtube.com/embed/VIDEO_ID
    else if (parsedUrl.pathname.startsWith('/embed/')) {
      videoId = parsedUrl.pathname.split('/embed/')[1]?.split('?')[0];
    }
    // 3. youtube.com/v/VIDEO_ID
    else if (parsedUrl.pathname.startsWith('/v/')) {
      videoId = parsedUrl.pathname.split('/v/')[1]?.split('?')[0];
    }
    // 4. youtube.com/shorts/VIDEO_ID
    else if (parsedUrl.pathname.startsWith('/shorts/')) {
      videoId = parsedUrl.pathname.split('/shorts/')[1]?.split('?')[0];
    }
  }
  // 5. youtu.be/VIDEO_ID
  else if (parsedUrl.hostname === 'youtu.be') {
    videoId = parsedUrl.pathname.slice(1).split('?')[0];
  }
  
  // Video ID 검증
  if (!videoId || videoId.length !== 11) {
    throw new Error(`Could not extract valid video ID from: ${url}`);
  }
  
  // Video ID 패턴 검증 (YouTube video ID는 11자리 영숫자와 일부 특수문자)
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (!videoIdPattern.test(videoId)) {
    throw new Error(`Invalid YouTube video ID format: ${videoId}`);
  }
  
  // 정규화된 URL 반환 (모든 쿼리 파라미터 제거)
  return `https://www.youtube.com/watch?v=${videoId}`;
}

console.log("🔧 Data Normalization Function Started");

Deno.serve(async (req) => {
  const validation = corsValidation(req, ["POST"]);
  if (validation) return validation;
  
  try {
    const supabase = createSupabaseClient();
    
    console.log("📊 Starting data normalization process...");
    
    // 요청 body에서 테이블 선택 (기본값: subtitles)
    const body = await req.json().catch(() => ({}));
    const targetTable = body.table || "subtitles";
    
    console.log(`🎯 Target table: ${targetTable}`);
    
    // 1. 모든 데이터 조회
    let selectQuery = "";
    if (targetTable === "summary") {
      selectQuery = "id, youtube_url, content, created_at";
    } else {
      selectQuery = "id, youtube_url, subtitle, created_at";
    }
    
    const { data: allRecords, error: fetchError } = await supabase
      .from(targetTable)
      .select(selectQuery)
      .order("id", { ascending: true });
    
    if (fetchError) {
      throw new Error(`Failed to fetch records: ${fetchError.message}`);
    }
    
    if (!allRecords || allRecords.length === 0) {
      return corsResponse({
        status: "success",
        message: "No records to normalize",
        stats: { total: 0, normalized: 0, duplicatesRemoved: 0 }
      });
    }
    
    console.log(`📋 Found ${allRecords.length} records to process`);
    
    // 2. 정규화 및 중복 감지
    const normalizedData = new Map<string, {
      id: number;
      originalUrl: string;
      normalizedUrl: string;
      content: string;
      created_at: string;
      duplicateIds: number[];
    }>();
    
    const stats = {
      total: allRecords.length,
      normalized: 0,
      duplicatesFound: 0,
      errors: 0,
      errorUrls: [] as string[]
    };
    
    for (const record of allRecords) {
      try {
        const normalizedUrl = normalizeYouTubeUrl(record.youtube_url);
        const needsNormalization = normalizedUrl !== record.youtube_url;
        
        if (needsNormalization) {
          stats.normalized++;
          console.log(`🔄 Normalized: ${record.youtube_url} → ${normalizedUrl}`);
        }
        
        // 중복 체크
        if (normalizedData.has(normalizedUrl)) {
          const existing = normalizedData.get(normalizedUrl)!;
          existing.duplicateIds.push(record.id);
          stats.duplicatesFound++;
          console.log(`🔍 Duplicate found: ID ${record.id} duplicates ID ${existing.id} (${normalizedUrl})`);
        } else {
          normalizedData.set(normalizedUrl, {
            id: record.id,
            originalUrl: record.youtube_url,
            normalizedUrl,
            content: targetTable === "summary" ? record.content : record.subtitle,
            created_at: record.created_at,
            duplicateIds: []
          });
        }
      } catch (error) {
        stats.errors++;
        stats.errorUrls.push(record.youtube_url);
        console.error(`❌ Error processing record ${record.id}: ${record.youtube_url} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`📊 Analysis complete: ${stats.normalized} need normalization, ${stats.duplicatesFound} duplicates found`);
    
    // 3. 데이터베이스 업데이트 (트랜잭션으로 처리)
    let updatedRecords = 0;
    let removedRecords = 0;
    
    for (const [normalizedUrl, data] of normalizedData) {
      try {
        // 원본 레코드 URL 정규화
        if (data.normalizedUrl !== data.originalUrl) {
          const { error: updateError } = await supabase
            .from(targetTable)
            .update({ youtube_url: data.normalizedUrl })
            .eq("id", data.id);
          
          if (updateError) {
            console.error(`❌ Failed to update record ${data.id}: ${updateError.message}`);
          } else {
            updatedRecords++;
            console.log(`✅ Updated record ${data.id}: ${data.originalUrl} → ${data.normalizedUrl}`);
          }
        }
        
        // 중복 레코드 삭제
        if (data.duplicateIds.length > 0) {
          const { error: deleteError } = await supabase
            .from(targetTable)
            .delete()
            .in("id", data.duplicateIds);
          
          if (deleteError) {
            console.error(`❌ Failed to delete duplicates for ${normalizedUrl}: ${deleteError.message}`);
          } else {
            removedRecords += data.duplicateIds.length;
            console.log(`🗑️ Removed ${data.duplicateIds.length} duplicate records for ${normalizedUrl}: [${data.duplicateIds.join(', ')}]`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${normalizedUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // 4. 최종 통계
    const finalStats = {
      originalTotal: stats.total,
      urlsNormalized: stats.normalized,
      recordsUpdated: updatedRecords,
      duplicatesFound: stats.duplicatesFound,
      duplicatesRemoved: removedRecords,
      errorsEncountered: stats.errors,
      errorUrls: stats.errorUrls,
      finalRecordCount: stats.total - removedRecords,
      uniqueVideos: normalizedData.size
    };
    
    console.log("✨ Data normalization completed!");
    console.log(`📊 Final stats:`, finalStats);
    
    return corsResponse({
      status: "success",
      message: "Data normalization completed successfully",
      stats: finalStats,
      debug: {
        processedAt: new Date().toISOString(),
        uniqueVideoUrls: Array.from(normalizedData.keys()).slice(0, 10) // 처음 10개만 표시
      }
    });
    
  } catch (error) {
    console.error("❌ Normalization error:", error);
    
    return corsError(
      error instanceof Error ? error.message : "Data normalization failed", 
      "NORMALIZATION_ERROR", 
      500
    );
  }
});