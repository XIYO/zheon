/**
 * SOCKS5 프록시를 통한 YouTube 접근
 * Tor 아이솔레이션: 각 요청마다 새로운 UUID 생성
 */

/**
 * UUID v4 생성 (Deno 네이티브)
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * SOCKS5 프록시를 통한 커스텀 fetch 함수 생성
 * @returns 프록시 설정된 fetch 함수
 */
export function createProxyFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    // 각 요청마다 새로운 UUID 생성 (Tor 아이솔레이션)
    const username = generateUUID();
    const password = generateUUID();

    // 환경변수에서 프록시 호스트와 포트 가져오기
    const proxyHost = Deno.env.get("SOCKS5_PROXY_HOST") || "localhost";
    const proxyPort = Deno.env.get("SOCKS5_PROXY_PORT") || "9050";

    const proxyUrl =
      `socks5://${username}:${password}@${proxyHost}:${proxyPort}`;

    console.log(
      `[Proxy] Using SOCKS5: ${proxyUrl.replace(/:[^:@]+@/, ":****@")}`,
    );

    // Deno의 createHttpClient로 SOCKS5 프록시 설정
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
 * YouTube URL에서 비디오 ID 추출
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
