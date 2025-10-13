/**
 * YouTube 자막 추출
 * EXTRACT_API_URL 환경변수를 사용하여 외부 API 호출
 */

export async function fetchTranscript(url: string): Promise<{ transcript: string }> {
  const apiUrl = Deno.env.get('EXTRACT_API_URL');

  if (!apiUrl) {
    throw new Error('EXTRACT_API_URL environment variable is not configured');
  }

  console.log(`[Transcript Fetcher] Processing: ${url}`);

  const requestUrl = new URL(apiUrl);
  requestUrl.searchParams.set('url', url);

  const response = await fetch(requestUrl.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Transcript Fetcher] API Error: ${response.status} - ${errorText}`);
    throw new Error(`Transcript API failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.transcript) {
    throw new Error('Missing transcript field in API response');
  }

  if (data.transcript.length === 0) {
    throw new Error('Transcript is empty');
  }

  console.log(`[Transcript Fetcher] ✅ Success: ${data.transcript.length} characters`);

  return { transcript: data.transcript };
}
