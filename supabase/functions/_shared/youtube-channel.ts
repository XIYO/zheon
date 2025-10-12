/**
 * YouTube Channel Fetcher with YouTube.js + SOCKS5 Proxy
 *
 * YouTube.js + SOCKS5 프록시를 사용하여 채널 정보 및 영상 목록 가져오기
 */

import { Innertube } from "npm:youtubei.js@latest";

export interface ChannelInfo {
  success: boolean;
  channel?: {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    subscriberCount?: string;
  };
  videos?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    url: string;
  }>;
  error?: string;
}

/**
 * UUID v4 생성 (Deno 네이티브)
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * SOCKS5 프록시를 통한 커스텀 fetch 함수
 */
function createProxyFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const username = generateUUID();
    const password = generateUUID();
    const proxyUrl = `socks5://${username}:${password}@xiyo.dev:19050`;

    console.log(
      `[Proxy] Using SOCKS5: ${proxyUrl.replace(/:[^:@]+@/, ":****@")}`,
    );

    const client = Deno.createHttpClient({
      proxy: { url: proxyUrl },
    });

    try {
      const response = await fetch(input, {
        ...init,
        client,
      });
      return response;
    } finally {
      client.close();
    }
  };
}

/**
 * 채널 ID 또는 핸들로 채널 정보 및 영상 목록 가져오기
 * @param channelIdOrHandle - 채널 ID (UCxxx) 또는 핸들 (@username)
 * @param maxVideos - 최대 영상 개수 (기본 30)
 */
export async function getChannelInfo(
  channelIdOrHandle: string,
  maxVideos: number = 30,
): Promise<ChannelInfo> {
  try {
    console.log(`[YouTube Channel] Fetching: ${channelIdOrHandle}`);

    // SOCKS5 프록시를 통한 Innertube 클라이언트 생성
    const proxyFetch = createProxyFetch();
    const yt = await Innertube.create({
      fetch: proxyFetch as any,
    });

    // 핸들인 경우 먼저 채널 ID로 변환
    let channelId = channelIdOrHandle;
    if (channelIdOrHandle.startsWith("@")) {
      console.log(`[YouTube Channel] Resolving handle to channel ID...`);
      const url = `https://www.youtube.com/${channelIdOrHandle}`;
      const resolved = await yt.resolveURL(url);

      if (resolved.payload?.browseId) {
        channelId = resolved.payload.browseId;
        console.log(`[YouTube Channel] Resolved to ID: ${channelId}`);
      } else {
        return {
          success: false,
          error: "Could not resolve channel handle to ID",
        };
      }
    }

    console.log(`[YouTube Channel] Getting channel info...`);
    const channel = await yt.getChannel(channelId);

    if (!channel) {
      return {
        success: false,
        error: "Channel not found",
      };
    }

    console.log(`[YouTube Channel] Channel: ${channel.metadata.title}`);

    // 영상 목록 가져오기
    console.log(`[YouTube Channel] Fetching videos...`);
    const videosData = await channel.getVideos();

    const videos = videosData.videos?.slice(0, maxVideos).map((video: any) => ({
      id: video.id,
      title: video.title?.text || "Untitled",
      thumbnail: video.thumbnails?.[0]?.url || "",
      publishedAt: video.published?.text || "",
      url: `https://www.youtube.com/watch?v=${video.id}`,
    })) || [];

    console.log(`[YouTube Channel] ✅ Success: ${videos.length} videos`);

    return {
      success: true,
      channel: {
        id: channel.metadata.external_id || channelIdOrHandle,
        name: channel.metadata.title || "Unknown Channel",
        description: channel.metadata.description || "",
        thumbnail: channel.metadata.avatar?.[0]?.url || "",
        subscriberCount:
          (channel as any).header?.c4TabbedHeaderRenderer?.subscriberCountText
            ?.simpleText || "",
      },
      videos,
    };
  } catch (error) {
    console.error("[YouTube Channel] ❌ Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
