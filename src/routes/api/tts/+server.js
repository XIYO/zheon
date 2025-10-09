import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

/**
 * WAV 파일 헤더 생성
 * @param {number} dataLength - PCM 데이터 길이
 * @param {number} sampleRate - 샘플레이트 (Hz)
 * @param {number} numChannels - 채널 수
 * @param {number} bitsPerSample - 비트 깊이
 * @returns {Buffer}
 */
function createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
	const header = Buffer.alloc(44);

	// RIFF chunk descriptor
	header.write('RIFF', 0);
	header.writeUInt32LE(36 + dataLength, 4); // File size - 8
	header.write('WAVE', 8);

	// fmt sub-chunk
	header.write('fmt ', 12);
	header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
	header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
	header.writeUInt16LE(numChannels, 22); // NumChannels
	header.writeUInt32LE(sampleRate, 24); // SampleRate
	header.writeUInt32LE((sampleRate * numChannels * bitsPerSample) / 8, 28); // ByteRate
	header.writeUInt16LE((numChannels * bitsPerSample) / 8, 32); // BlockAlign
	header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

	// data sub-chunk
	header.write('data', 36);
	header.writeUInt32LE(dataLength, 40); // Subchunk2Size

	return header;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { text } = await request.json();

		if (!text) {
			return json({ error: '텍스트가 필요합니다' }, { status: 400 });
		}

		if (!GEMINI_API_KEY) {
			return json({ error: 'Gemini API 키가 설정되지 않았습니다' }, { status: 500 });
		}

		// Gemini API 호출
		const response = await fetch(
			'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': GEMINI_API_KEY
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: text
								}
							]
						}
					],
					generationConfig: {
						responseModalities: ['AUDIO'],
						speechConfig: {
							voiceConfig: {
								prebuiltVoiceConfig: {
									voiceName: 'Kore' // 한국어 음성
								}
							}
						}
					},
					model: 'gemini-2.5-flash-preview-tts'
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.text();
			console.error('Gemini API 오류:', errorData);
			return json(
				{ error: 'Gemini API 호출 실패', details: errorData },
				{ status: response.status }
			);
		}

		const data = await response.json();

		// 오디오 데이터 추출
		if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.inlineData) {
			console.error('응답 데이터:', JSON.stringify(data, null, 2));
			return json({ error: '오디오 데이터를 찾을 수 없습니다' }, { status: 500 });
		}

		const audioData = data.candidates[0].content.parts[0].inlineData.data;

		// Base64 디코딩
		const pcmBuffer = Buffer.from(audioData, 'base64');

		// PCM을 WAV로 변환 (24kHz, 16-bit, mono)
		const sampleRate = 24000;
		const numChannels = 1;
		const bitsPerSample = 16;

		const wavHeader = createWavHeader(pcmBuffer.length, sampleRate, numChannels, bitsPerSample);
		const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

		return new Response(wavBuffer, {
			headers: {
				'Content-Type': 'audio/wav',
				'Content-Length': wavBuffer.length.toString()
			}
		});
	} catch (error) {
		console.error('TTS API 오류:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
