/**
 * Pending 레코드 생성 Runnable (UPSERT)
 * 입력: { url: string }
 * 출력: 입력 데이터 + { record_id: string, is_new: boolean }
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { createSupabaseClient } from "../supabase-client.ts";
import { fetchYouTubeMetadata } from "../youtube-metadata.ts";

export const createPendingRecord = RunnableLambda.from(
  async (input: { url: string }) => {
    console.log(`[PendingRecord] UPSERT for URL: ${input.url}`);

    const supabase = createSupabaseClient();

    try {
      // 🎬 YouTube 메타데이터 추출
      console.log(`[PendingRecord] Fetching YouTube metadata...`);
      const metadata = await fetchYouTubeMetadata(input.url);

      let title = "정리 중...";
      let thumbnailUrl = null;
      let channelName = null;

      if (metadata.success) {
        title = metadata.title ?? "정리 중...";
        thumbnailUrl = metadata.thumbnail_url ?? null;
        channelName = metadata.channel_name ?? null;

        if (!title || title.trim() === "") {
          console.warn("[PendingRecord] ⚠️ Title is empty, using fallback");
          title = "정리 중...";
        }

        console.log(`[PendingRecord] ✅ Metadata extracted:`, {
          title,
          channel: channelName,
          thumbnail: thumbnailUrl,
        });
      } else {
        console.warn(
          `[PendingRecord] ⚠️  Failed to fetch metadata: ${metadata.error}`,
        );
      }

      // UPSERT: 있으면 updated_at만 갱신, 없으면 INSERT
      const { data, error } = await supabase
        .from("summary")
        .upsert(
          {
            url: input.url,
            title,
            channel_name: channelName,
            thumbnail_url: thumbnailUrl,
            transcript: "",
            summary: "영상을 분석하고 있습니다",
            processing_status: "pending",
          },
          {
            onConflict: "url",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`UPSERT failed: ${error.message}`);
      }

      // 레코드가 이미 완료 상태인지 확인
      const isCompleted = data.processing_status === "completed";

      console.log(`[PendingRecord] ✅ UPSERT completed: ${data.id} (status: ${data.processing_status})`);

      return {
        ...input,
        record_id: data.id,
        is_new: !isCompleted,
        _skip_processing: isCompleted, // 완료된 레코드는 스킵
      };
    } catch (error) {
      console.error(`[PendingRecord] ❌ Error:`, error);
      throw error;
    }
  },
);
