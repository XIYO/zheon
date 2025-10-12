import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getChannelInfo } from "../_shared/youtube-channel.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { channelId, forceRefresh } = await req.json();

    if (!channelId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "channelId is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `[YouTube Channel API] Processing: ${channelId} (forceRefresh: ${forceRefresh})`,
    );

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first (skip if forceRefresh is true)
    if (!forceRefresh) {
      const { data: cachedChannel, error: cacheError } = await supabase
        .from("youtube_channel_cache")
        .select("channel_data, expires_at")
        .eq("channel_id", channelId)
        .single();

      if (cachedChannel && !cacheError) {
        const expiresAt = new Date(cachedChannel.expires_at);
        const now = new Date();

        // If cache is still valid
        if (expiresAt > now) {
          console.log(`[YouTube Channel API] Cache hit: ${channelId}`);

          // Get cached videos
          const { data: cachedVideos } = await supabase
            .from("youtube_channel_videos_cache")
            .select("video_data")
            .eq("channel_id", channelId);

          return new Response(
            JSON.stringify({
              success: true,
              channel: cachedChannel.channel_data,
              videos: cachedVideos?.map((v) => v.video_data) || [],
              cached: true,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        } else {
          console.log(`[YouTube Channel API] Cache expired: ${channelId}`);
          // Delete expired cache
          await supabase
            .from("youtube_channel_cache")
            .delete()
            .eq("channel_id", channelId);
        }
      }
    } else {
      console.log(`[YouTube Channel API] Force refresh: ${channelId}`);
    }

    // Cache miss or expired - fetch from YouTube
    console.log(`[YouTube Channel API] Cache miss: ${channelId}`);
    const result = await getChannelInfo(channelId, 30);

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 빠른 응답: 기본 채널 정보만 먼저 리턴
    const quickResponse = {
      success: true,
      channel: result.channel,
      videos: [],
      cached: false,
      loading: true,
    };

    // 백그라운드로 비디오 + 캐시 저장
    (async () => {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour TTL

        await supabase
          .from("youtube_channel_cache")
          .upsert({
            channel_id: channelId,
            channel_data: result.channel,
            cached_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          });

        // Delete old videos and insert new ones
        await supabase
          .from("youtube_channel_videos_cache")
          .delete()
          .eq("channel_id", channelId);

        if (result.videos && result.videos.length > 0) {
          await supabase
            .from("youtube_channel_videos_cache")
            .insert(
              result.videos.map((video) => ({
                channel_id: channelId,
                video_data: video,
              })),
            );
        }

        console.log(
          `[YouTube Channel API] Background caching completed: ${channelId}`,
        );
      } catch (error) {
        console.error(
          `[YouTube Channel API] Background caching failed: ${channelId}`,
          error,
        );
      }
    })();

    return new Response(
      JSON.stringify(quickResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[YouTube Channel API] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
