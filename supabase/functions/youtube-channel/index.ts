import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getChannelInfo } from "../_shared/youtube-api.ts";

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
        .from("channels")
        .select("*")
        .eq("channel_id", channelId)
        .single();

      if (cachedChannel && !cacheError) {
        console.log(`[YouTube Channel API] Cache hit: ${channelId}`);

        // Get cached videos
        const { data: cachedVideos } = await supabase
          .from("channel_videos")
          .select("*")
          .eq("channel_id", channelId)
          .order("published_at", { ascending: false });

        // Return cached data (without TTL check)
        if (!cachedVideos) {
          console.warn(`[YouTube Channel API] No cached videos found for channel ${channelId}`);
        }

        const videos = cachedVideos
          ? cachedVideos.map((v) => ({
              id: v.video_id,
              title: v.title,
              thumbnail: v.thumbnail_url,
              publishedAt: v.published_at,
              url: `https://www.youtube.com/watch?v=${v.video_id}`,
              ...v.video_data,
            }))
          : [];

        return new Response(
          JSON.stringify({
            success: true,
            channel: {
              id: cachedChannel.channel_id,
              name: cachedChannel.channel_name,
              description: cachedChannel.description,
              thumbnail: cachedChannel.channel_avatar,
              subscriberCount: cachedChannel.subscriber_count,
            },
            videos,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else {
      console.log(`[YouTube Channel API] Force refresh: ${channelId}`);
    }

    // Cache miss or force refresh - fetch from YouTube
    console.log(`[YouTube Channel API] Fetching from YouTube: ${channelId}`);
    const result = await getChannelInfo(channelId, 30);

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to database
    try {
      // Validate required fields from API response
      if (!result.channel.id) {
        throw new Error(
          `Missing channel.id in API response for ${channelId}. Cannot save to database.`,
        );
      }

      if (result.videos === undefined) {
        throw new Error(
          `Missing videos field in API response for ${channelId}. API contract violated.`,
        );
      }

      const videoCount = result.videos.length;

      // Update channel info
      await supabase
        .from("channels")
        .upsert({
          channel_id: result.channel.id,
          channel_name: result.channel.name,
          channel_avatar: result.channel.thumbnail,
          subscriber_count: result.channel.subscriberCount,
          description: result.channel.description,
          video_count: videoCount,
          channel_data: {
            handle: channelId.startsWith('@') ? channelId : null,
            ...result.channel,
          },
        });

      // Delete old videos and insert new ones
      await supabase
        .from("channel_videos")
        .delete()
        .eq("channel_id", result.channel.id);

      if (result.videos.length > 0) {
        const videoInserts = result.videos.map((video) => ({
          video_id: video.id,
          channel_id: result.channel.id,
          title: video.title,
          thumbnail_url: video.thumbnail,
          published_at: video.publishedAt,
          video_data: video,
        }));

        await supabase
          .from("channel_videos")
          .insert(videoInserts);
      }

      console.log(
        `[YouTube Channel API] Saved to database: ${channelId} (${videoCount} videos)`,
      );
    } catch (dbError) {
      console.error(
        `[YouTube Channel API] Database error: ${channelId}`,
        dbError,
      );
    }

    // Return the fetched data
    if (result.videos === undefined) {
      throw new Error(
        `Missing videos field in API response for ${channelId}. API contract violated.`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel: result.channel,
        videos: result.videos,
        cached: false,
      }),
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