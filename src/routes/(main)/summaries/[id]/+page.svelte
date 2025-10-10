<script>
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let { data } = $props();

	// summary를 반응형 상태로 관리
	let summary = $state({
		...data.summary
	});

	// 페이지 로드 시 한 번만 로그 출력
	console.log('[TTS] Summary loaded:', {
		id: summary.id,
		summary_audio_status: summary.summary_audio_status,
		summary_audio_url: summary.summary_audio_url,
		insights_audio_status: summary.insights_audio_status,
		insights_audio_url: summary.insights_audio_url
	});

	// TTS 상태 관리
	let isReading = $state(false);
	let currentSection = $state(''); // '', 'summary', 'content', 'all'
	let utterance = $state(null);
	let bestVoice = $state(null);

	// Gemini TTS 오디오 객체 관리
	let currentAudio = $state(null);

	// Gemini TTS 상태별 UI 텍스트 및 스타일
	function getGeminiButtonState(section) {
		const statusKey = `${section}_audio_status`;
		const status = summary[statusKey];

		// 현재 재생 중인 섹션인지 확인
		const isPlaying = isReading && currentSection === section + '-gemini';

		if (isPlaying) {
			return { text: '■ 중지', disabled: false, processing: false };
		} else if (status === 'completed') {
			return { text: '▶ 재생', disabled: false, processing: false };
		} else if (status === 'processing') {
			return { text: '⏳ 생성 중...', disabled: true, processing: true };
		} else {
			// null or 'failed'
			return { text: 'Gemini TTS', disabled: false, processing: false };
		}
	}

	// TODO: Supabase Realtime 연결로 실시간 상태 업데이트
	// processing 상태일 때 Realtime으로 summary 테이블의 status 컬럼 변경 감지
	// completed로 변경되면 자동으로 UI 업데이트 및 재생 가능 상태로 전환
	// Example:
	// const channel = supabase
	//   .channel('summary-audio-status')
	//   .on('postgres_changes', {
	//     event: 'UPDATE',
	//     schema: 'public',
	//     table: 'summary',
	//     filter: `id=eq.${summary.id}`
	//   }, (payload) => {
	//     summary.summary_audio_status = payload.new.summary_audio_status;
	//     summary.insights_audio_status = payload.new.content_audio_status;
	//   })
	//   .subscribe();

	function extractYoutubeId(url) {
		try {
			const parsedUrl = new URL(url);

			// youtu.be 형태 처리
			if (parsedUrl.hostname === 'youtu.be') {
				return parsedUrl.pathname.slice(1); // '/' 제거
			}

			// youtube.com 형태 처리
			if (parsedUrl.hostname.includes('youtube.com')) {
				return parsedUrl.searchParams.get('v') || '';
			}
		} catch {
			return '';
		}
		return '';
	}

	function extractThumbnail(url) {
		const id = extractYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// 최고 품질의 한국어 음성 찾기
	function loadBestVoice() {
		const voices = speechSynthesis.getVoices();
		const koVoices = voices.filter(
			(voice) => voice.lang.startsWith('ko') || voice.lang.startsWith('kr')
		);

		if (koVoices.length === 0) {
			console.log('[TTS] 한국어 음성을 찾을 수 없습니다. 영어 음성으로 대체합니다.');
			return voices[0] || null; // 첫 번째 사용 가능한 음성 반환
		}

		// 우선순위: Google > Apple (Neural) > Microsoft
		// Google voices (온라인, 고품질)
		let voice = koVoices.find((v) => v.name.includes('Google') && v.name.includes('ko-KR'));

		// Apple Neural voices (macOS/iOS)
		if (!voice) {
			voice = koVoices.find((v) => v.name.includes('Yuna') || v.name.includes('Sora'));
		}

		// Any Apple voice
		if (!voice) {
			voice = koVoices.find((v) => v.name.includes('Kyuri') || v.name.includes('Minsu'));
		}

		// Microsoft voices
		if (!voice) {
			voice = koVoices.find((v) => v.name.includes('Microsoft'));
		}

		// 그 외 첫 번째 한국어 음성
		if (!voice) {
			voice = koVoices[0];
		}

		console.log('선택된 음성:', voice?.name, voice?.lang);
		return voice;
	}

	// 음성 로드 (브라우저가 음성 목록을 비동기로 로드할 수 있음)
	if (typeof window !== 'undefined') {
		speechSynthesis.onvoiceschanged = () => {
			bestVoice = loadBestVoice();
		};
		bestVoice = loadBestVoice();
	}

	// TTS 함수들
	function speak(text, section) {
		// 이미 읽고 있으면 중지
		if (isReading && currentSection === section) {
			stopReading();
			return;
		}

		// 다른 섹션 읽고 있으면 중지하고 새로 시작
		if (isReading) {
			stopReading();
		}

		utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'ko-KR';
		utterance.rate = 1.0;
		utterance.pitch = 1.0;
		utterance.volume = 1.0;

		// 최고 품질 음성 사용
		if (bestVoice) {
			utterance.voice = bestVoice;
		}

		utterance.onstart = () => {
			isReading = true;
			currentSection = section;
		};

		utterance.onend = () => {
			isReading = false;
			currentSection = '';
		};

		utterance.onerror = () => {
			isReading = false;
			currentSection = '';
		};

		speechSynthesis.speak(utterance);
	}

	function stopReading() {
		speechSynthesis.cancel();
		isReading = false;
		currentSection = '';
	}

	function readSummary() {
		speak(summary.summary, 'summary');
	}

	function readContent() {
		speak(summary.insights, 'insights');
	}

	function readAll() {
		const allText = `AI 요약. ${summary.summary}. 핵심 인사이트. ${summary.insights}`;
		speak(allText, 'all');
	}

	// Gemini TTS 함수 (실시간 스트리밍)
	async function readGemini(section) {
		console.log('readGemini 호출됨:', section);

		// 이미 재생 중이면 중지
		if (isReading && currentSection === section + '-gemini') {
			if (currentAudio) {
				currentAudio.pause();
				currentAudio = null;
			}
			isReading = false;
			currentSection = '';
			return;
		}

		try {
			// 기존 TTS 중지
			stopReading();

			let text = '';
			const urlKey = `${section}_audio_url`;
			const statusKey = `${section}_audio_status`;
			const cachedAudioUrl = summary[urlKey];

			// 캐시된 오디오가 있으면 바로 재생
			if (cachedAudioUrl && summary[statusKey] === 'completed') {
				isReading = true;
				currentSection = section + '-gemini';

				const audioUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/tts-audio/${cachedAudioUrl}`;
				currentAudio = new Audio(audioUrl);

				currentAudio.onended = () => {
					isReading = false;
					currentSection = '';
					currentAudio = null;
				};

				currentAudio.onerror = () => {
					isReading = false;
					currentSection = '';
					currentAudio = null;
				};

				await currentAudio.play();
				return;
			}

			// 캐시가 없으면 실시간 스트리밍 생성
			if (section === 'summary') {
				text = summary.summary;
			} else if (section === 'insights') {
				text = summary.insights;
			}

			// 처리 시작 상태로 변경
			summary[statusKey] = 'processing';
			isReading = true;
			currentSection = section + '-gemini';

			// Supabase Edge Function으로 SSE 연결
			const url = `${PUBLIC_SUPABASE_URL}/functions/v1/tts-stream`;
			console.log('Fetch URL:', url);
			console.log('Request body:', { text, summaryId: summary.id, section });

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`
				},
				body: JSON.stringify({
					text,
					summaryId: summary.id,
					section
				})
			});

			console.log('Response status:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Response error:', errorText);
				throw new Error('TTS 생성 실패');
			}

			// JSON 응답 파싱
			const result = await response.json();
			console.log('[TTS] Received result:', result);

			if (!result.success || !result.audioUrl) {
				throw new Error('오디오 URL을 받지 못했습니다');
			}

			// summary 상태 업데이트 (UI 반영)
			summary[urlKey] = result.fileName;
			summary[statusKey] = 'completed';
			console.log('[TTS] Updated summary state:', { [urlKey]: result.fileName, [statusKey]: 'completed' });

			// 오디오 재생
			currentAudio = new Audio(result.audioUrl);

			currentAudio.onended = () => {
				console.log('[Audio] Playback ended');
				isReading = false;
				currentSection = '';
				currentAudio = null;
			};

			currentAudio.onerror = (e) => {
				console.error('[Audio] Playback error:', e);
				isReading = false;
				currentSection = '';
				currentAudio = null;
			};

			console.log('[Audio] Starting playback...');
			await currentAudio.play();
			console.log('[Audio] Play() called');
		} catch (error) {
			console.error('Gemini TTS 오류:', error);
			alert('음성 생성에 실패했습니다: ' + error.message);

			// 에러 발생 시 상태를 'failed'로 설정
			summary[`${section}_audio_status`] = 'failed';

			isReading = false;
			currentSection = '';
			currentAudio = null;
		}
	}

	// 컴포넌트 언마운트 시 정리
	$effect.pre(() => {
		return () => {
			stopReading();
			if (currentAudio) {
				currentAudio.pause();
				currentAudio = null;
			}
		};
	});
</script>

<div class="container mx-auto px-4 py-12 max-w-4xl">
	<!-- 썸네일 -->
	<a href={summary.url} target="_blank" rel="noopener noreferrer">
		<img
			src={extractThumbnail(summary.url)}
			alt={summary.title}
			width="1280"
			height="720"
			class="w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-700 opacity-100 starting:opacity-0"
			style="view-transition-name: summary-image-{summary.id}; aspect-ratio: 16/9" />
	</a>

	<!-- 제목과 날짜 -->
	<div class="mt-8 mb-12">
		<h1 class="text-3xl font-bold mb-2">{summary.title}</h1>
		<p class="text-sm text-surface-600 dark:text-surface-400">
			{formatDate(summary.created_at)}
		</p>
	</div>

	<!-- 전체 읽기 버튼 -->
	<div class="mb-6 flex justify-end">
		<button
			class="preset-filled-primary-500 px-6 py-3 rounded-full font-semibold"
			onclick={readAll}>
			{currentSection === 'all' ? '중지' : '전체 읽기'}
		</button>
	</div>

	<!-- AI 요약 -->
	<div class="bg-white dark:bg-surface-800 rounded-xl p-6 mb-8">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">AI 요약</h2>
			<div class="flex gap-2">
				<button class="chip preset-tonal-secondary-500" onclick={readSummary}>
					{currentSection === 'summary' ? '중지' : '읽기'}
				</button>
				<button
					class="chip {getGeminiButtonState('summary').processing ? 'preset-tonal-surface-500' : 'preset-tonal-primary-500'}"
					onclick={() => readGemini('summary')}
					disabled={getGeminiButtonState('summary').disabled}>
					{getGeminiButtonState('summary').text}
				</button>
			</div>
		</div>
		<p class="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
			{summary.summary}
		</p>
	</div>

	<!-- 핵심 인사이트 (content 필드에 인사이트가 있는 경우) -->
	{#if summary.insights && summary.insights !== summary.summary}
		<div
			class="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold">핵심 인사이트</h2>
				<div class="flex gap-2">
					<button class="chip preset-tonal-secondary-500" onclick={readContent}>
						{currentSection === 'insights' ? '중지' : '읽기'}
					</button>
					<button
						class="chip {getGeminiButtonState('insights').processing ? 'preset-tonal-surface-500' : 'preset-tonal-primary-500'}"
						onclick={() => readGemini('insights')}
						disabled={getGeminiButtonState('insights').disabled}>
						{getGeminiButtonState('insights').text}
					</button>
				</div>
			</div>
			<div class="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
				{summary.insights}
			</div>
		</div>
	{/if}
</div>
