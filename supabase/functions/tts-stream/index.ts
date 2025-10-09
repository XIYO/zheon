import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequestBody {
	text: string;
	summaryId: number;
	section: 'summary' | 'content';
}

/**
 * WAV 파일 생성 (헤더 + PCM 데이터)
 */
function createWavFile(
	pcmData: Uint8Array,
	sampleRate: number,
	numChannels: number,
	bitsPerSample: number
): Uint8Array {
	const header = new ArrayBuffer(44);
	const view = new DataView(header);

	// RIFF chunk descriptor
	writeString(view, 0, 'RIFF');
	view.setUint32(4, 36 + pcmData.length, true);
	writeString(view, 8, 'WAVE');

	// fmt sub-chunk
	writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true); // Subchunk1Size
	view.setUint16(20, 1, true); // AudioFormat (PCM)
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
	view.setUint16(32, (numChannels * bitsPerSample) / 8, true);
	view.setUint16(34, bitsPerSample, true);

	// data sub-chunk
	writeString(view, 36, 'data');
	view.setUint32(40, pcmData.length, true);

	// 헤더 + 데이터 합치기
	const wavFile = new Uint8Array(header.byteLength + pcmData.length);
	wavFile.set(new Uint8Array(header), 0);
	wavFile.set(pcmData, header.byteLength);

	return wavFile;
}

function writeString(view: DataView, offset: number, string: string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

Deno.serve(async (req) => {
	// CORS 헤더
	if (req.method === 'OPTIONS') {
		return new Response(null, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info'
			}
		});
	}

	try {
		console.log('[TTS] Request received');
		const { text, summaryId, section }: RequestBody = await req.json();
		console.log('[TTS] Parsed body:', { textLength: text?.length, summaryId, section });

		if (!text || !summaryId || !section) {
			console.error('[TTS] Missing required fields');
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		if (!GEMINI_API_KEY) {
			console.error('[TTS] GEMINI_API_KEY not configured');
			return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		const audioUrlColumn = `${section}_audio_url` as 'summary_audio_url' | 'content_audio_url';
		const statusColumn = `${section}_audio_status` as 'summary_audio_status' | 'content_audio_status';

		const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// 1. 먼저 현재 상태 확인
		const { data: currentData, error: fetchError } = await supabase
			.from('summary')
			.select(`${audioUrlColumn}, ${statusColumn}`)
			.eq('id', summaryId)
			.single();

		if (fetchError) {
			console.error('[TTS] Fetch error:', fetchError);
			return new Response(JSON.stringify({ error: '데이터 조회 실패', details: fetchError }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		// @ts-ignore - Dynamic column access
		const existingUrl = currentData[audioUrlColumn];
		// @ts-ignore - Dynamic column access
		const currentStatus = currentData[statusColumn];

		console.log('[TTS] Current state:', { existingUrl, currentStatus });

		// 2. 이미 완료된 경우 즉시 반환
		if (existingUrl && currentStatus === 'completed') {
			console.log('[TTS] Already completed, returning existing URL');
			const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/tts-audio/${existingUrl}`;
			return new Response(
				JSON.stringify({
					success: true,
					audioUrl,
					fileName: existingUrl,
					cached: true
				}),
				{
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*'
					}
				}
			);
		}

		// 3. 다른 요청이 이미 처리 중인 경우 폴링 대기 (최대 60초)
		if (currentStatus === 'processing') {
			console.log('[TTS] Another request is processing, waiting...');

			const maxAttempts = 30; // 30회 * 2초 = 60초
			for (let i = 0; i < maxAttempts; i++) {
				await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기

				const { data: pollData } = await supabase
					.from('summary')
					.select(`${audioUrlColumn}, ${statusColumn}`)
					.eq('id', summaryId)
					.single();

				// @ts-ignore - Dynamic column access
				if (pollData && pollData[statusColumn] === 'completed' && pollData[audioUrlColumn]) {
					console.log('[TTS] Processing completed by another request');
					// @ts-ignore - Dynamic column access
					const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/tts-audio/${pollData[audioUrlColumn]}`;
					return new Response(
						JSON.stringify({
							success: true,
							audioUrl,
							// @ts-ignore - Dynamic column access
							fileName: pollData[audioUrlColumn],
							cached: true,
							waited: true
						}),
						{
							headers: {
								'Content-Type': 'application/json',
								'Access-Control-Allow-Origin': '*'
							}
						}
					);
				}

				// @ts-ignore - Dynamic column access
				if (pollData && pollData[statusColumn] === 'failed') {
					console.log('[TTS] Processing failed by another request, will retry');
					break;
				}
			}
		}

		// 4. 원자적 락 획득 - UPDATE의 affected rows 확인
		console.log('[TTS] Attempting to acquire lock...');

		// Raw SQL로 원자적 UPDATE 실행
		const { data: updateResult, error: updateError } = await supabase
			.rpc('update_processing_status', {
				p_summary_id: summaryId,
				p_section: section
			});

		if (updateError) {
			console.error('[TTS] Lock update failed:', updateError);
			return new Response(JSON.stringify({ error: '락 획득 실패', details: updateError }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		// updateResult가 false면 다른 요청이 이미 락을 획득했거나 처리 중
		if (!updateResult) {
			console.log('[TTS] Failed to acquire lock, another request is processing or completed');

			// 폴링으로 완료 대기
			const maxAttempts = 30;
			for (let i = 0; i < maxAttempts; i++) {
				await new Promise(resolve => setTimeout(resolve, 2000));

				const { data: pollData } = await supabase
					.from('summary')
					.select(`${audioUrlColumn}, ${statusColumn}`)
					.eq('id', summaryId)
					.single();

				// @ts-ignore - Dynamic column access
				if (pollData && pollData[statusColumn] === 'completed' && pollData[audioUrlColumn]) {
					console.log('[TTS] Processing completed by another request');
					// @ts-ignore - Dynamic column access
					const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/tts-audio/${pollData[audioUrlColumn]}`;
					return new Response(
						JSON.stringify({
							success: true,
							audioUrl,
							// @ts-ignore - Dynamic column access
							fileName: pollData[audioUrlColumn],
							cached: true,
							waited: true
						}),
						{
							headers: {
								'Content-Type': 'application/json',
								'Access-Control-Allow-Origin': '*'
							}
						}
					);
				}
			}

			return new Response(JSON.stringify({ error: '처리 시간 초과' }), {
				status: 408,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		console.log('[TTS] Lock acquired successfully, starting generation...');
		console.log('[TTS] Calling Gemini TTS API...');

		// Gemini TTS REST API 호출
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
							parts: [{ text }]
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
			const errorText = await response.text();
			console.error('[TTS] Gemini API error:', errorText);
			return new Response(JSON.stringify({ error: 'Gemini API 호출 실패', details: errorText }), {
				status: response.status,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		const data = await response.json();

		// 오디오 데이터 추출
		if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.inlineData) {
			console.error('[TTS] No audio data in response');
			return new Response(JSON.stringify({ error: '오디오 데이터를 찾을 수 없습니다' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		const audioData = data.candidates[0].content.parts[0].inlineData.data;
		console.log('[TTS] Received audio data, length:', audioData.length);

		// Base64 디코딩
		const pcmBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));
		console.log('[TTS] Decoded PCM data, length:', pcmBuffer.length);

		// PCM을 WAV로 변환 (24kHz, 16-bit, mono)
		const wavBuffer = createWavFile(pcmBuffer, 24000, 1, 16);
		console.log('[TTS] Created WAV file, size:', wavBuffer.length);

		// Supabase Storage 업로드
		const fileName = `${summaryId}_${section}_${Date.now()}.wav`;
		console.log('[TTS] Uploading to storage:', fileName);

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('tts-audio')
			.upload(fileName, wavBuffer, {
				contentType: 'audio/wav',
				upsert: true
			});

		if (uploadError) {
			console.error('[TTS] Storage upload error:', uploadError);
			return new Response(JSON.stringify({ error: '저장소 업로드 실패', details: uploadError }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		console.log('[TTS] File uploaded successfully');

		// DB 업데이트 - URL과 status를 'completed'로
		const { error: dbUpdateError } = await supabase
			.from('summary')
			.update({
				[audioUrlColumn]: fileName,
				[statusColumn]: 'completed'
			})
			.eq('id', summaryId);

		if (dbUpdateError) {
			console.error('[TTS] DB update error:', dbUpdateError);
			// 실패 시 status를 'failed'로 업데이트
			await supabase
				.from('summary')
				.update({ [statusColumn]: 'failed' })
				.eq('id', summaryId);

			return new Response(JSON.stringify({ error: 'DB 업데이트 실패', details: dbUpdateError }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		console.log('[TTS] DB updated successfully');

		// 오디오 URL 반환
		const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/tts-audio/${fileName}`;
		console.log('[TTS] Returning audio URL:', audioUrl);

		return new Response(
			JSON.stringify({
				success: true,
				audioUrl,
				fileName
			}),
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			}
		);
	} catch (error) {
		console.error('[TTS] Request error:', error);

		// 에러 발생 시 status를 'failed'로 업데이트 시도
		try {
			const { text, summaryId, section } = await req.json();
			if (summaryId && section) {
				const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
				const statusColumn = `${section}_audio_status`;
				await supabase
					.from('summary')
					.update({ [statusColumn]: 'failed' })
					.eq('id', summaryId);
			}
		} catch (cleanupError) {
			console.error('[TTS] Cleanup error:', cleanupError);
		}

		const errorMessage = error instanceof Error ? error.message : String(error);
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
	}
});
