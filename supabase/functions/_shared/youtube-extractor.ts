/**
 * YouTube Subtitle Extractor using external API
 *
 * extractor.xiyo.dev API를 사용하여 자막 추출
 */

export interface YouTubeExtractionResult {
	success: boolean;
	transcript?: string;
	cached?: boolean;
	error?: string;
	youtubeUrl: string;
}

/**
 * YouTube 비디오에서 자막 추출
 */
export async function extractYouTubeSubtitles(
	youtubeUrl: string
): Promise<YouTubeExtractionResult> {
	const extractorBaseUrl = Deno.env.get("EXTRACT_API_URL") || "https://extractor.xiyo.dev/extract";

	try {
		console.log(`[YouTube Extractor] Processing: ${youtubeUrl}`);
		console.log(`[YouTube Extractor] API: ${extractorBaseUrl}`);

		// Build GET request URL with query parameter
		const url = new URL(extractorBaseUrl);
		url.searchParams.set("url", youtubeUrl);

		const response = await fetch(url.toString());

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[YouTube Extractor] API Error: ${response.status} - ${errorText}`);
			return {
				success: false,
				error: `Extractor API error: ${response.status}`,
				youtubeUrl,
			};
		}

		const data = await response.json();

		// extractor.xiyo.dev returns { transcript: string, detected_language: string }
		if (!data.transcript || data.transcript.length === 0) {
			return {
				success: false,
				error: "Transcript is empty",
				youtubeUrl,
			};
		}

		console.log(`[YouTube Extractor] ✅ Success: ${data.transcript.length} characters`);

		return {
			success: true,
			transcript: data.transcript,
			youtubeUrl,
			cached: false,
		};
	} catch (error) {
		console.error("[YouTube Extractor] ❌ Error:", error);

		const errorMessage = error instanceof Error ? error.message : String(error);

		return {
			success: false,
			error: errorMessage,
			youtubeUrl,
		};
	}
}
