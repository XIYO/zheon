/**
 * URL 검증 및 정규화
 *
 * 지원하는 YouTube URL 형태:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - 모든 쿼리 파라미터 제거 (t=, si=, feature= 등)
 */

/**
 * YouTube URL을 정규화하여 표준 형태로 변환
 */
function normalizeYouTubeUrl(url: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // YouTube 도메인 검증
  const youtubePatterns = [
    /^(www\.)?youtube\.com$/,
    /^(www\.)?youtu\.be$/,
    /^m\.youtube\.com$/,
    /^music\.youtube\.com$/,
  ];

  const isYouTube = youtubePatterns.some((pattern) =>
    pattern.test(parsedUrl.hostname)
  );

  if (!isYouTube) {
    throw new Error(
      `Unsupported URL. Currently only YouTube videos are supported. Received: ${parsedUrl.hostname}`
    );
  }

  let videoId: string | null = null;

  // Video ID 추출 로직
  if (parsedUrl.hostname.includes('youtube.com')) {
    // 1. youtube.com/watch?v=VIDEO_ID
    if (parsedUrl.pathname === '/watch') {
      videoId = parsedUrl.searchParams.get('v');
    } // 2. youtube.com/embed/VIDEO_ID
    else if (parsedUrl.pathname.startsWith('/embed/')) {
      videoId = parsedUrl.pathname.split('/embed/')[1]?.split('?')[0];
    } // 3. youtube.com/v/VIDEO_ID
    else if (parsedUrl.pathname.startsWith('/v/')) {
      videoId = parsedUrl.pathname.split('/v/')[1]?.split('?')[0];
    } // 4. youtube.com/shorts/VIDEO_ID
    else if (parsedUrl.pathname.startsWith('/shorts/')) {
      videoId = parsedUrl.pathname.split('/shorts/')[1]?.split('?')[0];
    }
  } // 5. youtu.be/VIDEO_ID
  else if (parsedUrl.hostname === 'youtu.be') {
    videoId = parsedUrl.pathname.slice(1).split('?')[0];
  }

  // Video ID 검증
  if (!videoId || videoId.length !== 11) {
    throw new Error('Invalid YouTube URL. Could not extract valid video ID');
  }

  // Video ID 패턴 검증 (YouTube video ID는 11자리 영숫자와 일부 특수문자)
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (!videoIdPattern.test(videoId)) {
    throw new Error('Invalid YouTube video ID format');
  }

  // 정규화된 URL 반환 (모든 쿼리 파라미터 제거)
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function validateUrl(url: string): Promise<string> {
  console.log(`[Validate] Checking URL: ${url}`);

  const normalizedUrl = normalizeYouTubeUrl(url);

  // Video ID 추출 (로그용)
  const videoId = new URL(normalizedUrl).searchParams.get('v');
  console.log(`[Validate] ✅ Valid YouTube URL, video ID: ${videoId}`);
  console.log(`[Validate] 🔄 Normalized: ${url} → ${normalizedUrl}`);

  return normalizedUrl;
}
