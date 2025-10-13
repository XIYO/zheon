/**
 * Gemini TTS API 호출
 * 단일 텍스트 → Base64 PCM 변환
 */

export async function callGeminiTTS(
  text: string,
  apiKey: string
): Promise<Uint8Array> {
  console.log(`[Gemini TTS] Calling API for text length: ${text.length}`);

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
        },
        model: "gemini-2.5-flash-preview-tts",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini TTS] API error:`, errorText);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    throw new Error("No audio data in Gemini API response");
  }

  const audioData = data.candidates[0].content.parts[0].inlineData.data;
  const pcmBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));

  console.log(`[Gemini TTS] ✅ Generated PCM: ${pcmBuffer.length} bytes`);

  return pcmBuffer;
}

export async function callGeminiTTSParallel(
  chunks: string[],
  apiKey: string
): Promise<Uint8Array[]> {
  console.log(`[Gemini TTS] Calling ${chunks.length} chunks in parallel`);

  const results = await Promise.all(
    chunks.map((chunk) => callGeminiTTS(chunk, apiKey))
  );

  console.log(`[Gemini TTS] ✅ All chunks completed`);

  return results;
}
