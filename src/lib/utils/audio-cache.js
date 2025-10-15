/**
 * Audio Cache - Worker 기반 OPFS 캐싱
 * - 모든 OPFS 작업을 Worker에서 처리
 * - Promise 기반 통신 래퍼
 */

let worker = null;
let messageId = 0;
const pendingMessages = new Map();

/**
 * Worker 인스턴스 가져오기
 */
function getWorker() {
	if (worker) return worker;

	worker = new Worker(new URL('../workers/audio-cache.worker.js', import.meta.url), {
		type: 'module'
	});

	worker.onmessage = (event) => {
		const { messageId: id, success, data, error } = event.data;
		const pending = pendingMessages.get(id);

		if (pending) {
			pendingMessages.delete(id);
			if (success) {
				pending.resolve(data);
			} else {
				pending.reject(new Error(error));
			}
		}
	};

	worker.onerror = (error) => {
		console.error('[Audio Cache] Worker error:', error);
	};

	return worker;
}

/**
 * Worker에 메시지 전송
 */
function postMessage(action, data = {}) {
	return new Promise((resolve, reject) => {
		const id = messageId++;
		const w = getWorker();

		pendingMessages.set(id, { resolve, reject });

		w.postMessage({
			messageId: id,
			action,
			...data
		});
	});
}

/**
 * 파일 크기 포맷팅
 */
function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 스트리밍 다운로드
 */
async function streamingDownload(cacheKey, signedUrl, startOffset = 0) {
	const headers = {};
	if (startOffset > 0) {
		headers['Range'] = `bytes=${startOffset}-`;
	}

	const response = await fetch(signedUrl, { headers });

	if (!response.ok) {
		throw new Error(`Failed to fetch audio: ${response.statusText}`);
	}

	const totalSize = startOffset + parseInt(response.headers.get('Content-Length') || '0', 10);
	const etag = response.headers.get('ETag');
	const lastModified = response.headers.get('Last-Modified');

	if (startOffset === 0) {
		console.log(`[Audio Cache] Starting download: ${formatBytes(totalSize)}`);
		await postMessage('initDownload', {
			id: cacheKey,
			metadata: { totalSize, etag, lastModified }
		});
	} else {
		const remaining = totalSize - startOffset;
		console.log(
			`[Audio Cache] Resuming download: ${formatBytes(startOffset)} / ${formatBytes(totalSize)} (${formatBytes(remaining)} remaining)`
		);
	}

	const reader = response.body.getReader();
	let offset = startOffset;
	let lastLogTime = Date.now();
	const LOG_INTERVAL = 500;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		await postMessage('writeChunk', {
			id: cacheKey,
			offset,
			buffer: value
		});

		offset += value.length;

		const now = Date.now();
		if (now - lastLogTime > LOG_INTERVAL) {
			const progress = ((offset / totalSize) * 100).toFixed(1);
			console.log(
				`[Audio Cache] Downloading: ${progress}% (${formatBytes(offset)} / ${formatBytes(totalSize)})`
			);
			lastLogTime = now;
		}

		await postMessage('updateMetadata', {
			id: cacheKey,
			updates: { downloadedBytes: offset }
		});
	}

	await postMessage('updateMetadata', {
		id: cacheKey,
		updates: { complete: true }
	});

	console.log(`[Audio Cache] Download complete: ${formatBytes(totalSize)}`);
}

/**
 * Summary 오디오 가져오기
 * - 캐시가 있으면 즉시 반환
 * - 부분 다운로드 있으면 이어받기
 * - 없으면 처음부터 다운로드
 *
 * @param {string} summaryId - Summary ID
 * @param {Function} getSignedUrlFn - Remote 함수
 * @returns {Promise<string>} - blob URL
 */
export async function getSummaryAudio(summaryId, getSignedUrlFn) {
	const cacheKey = `${summaryId}-summary`;

	const progress = await postMessage('getProgress', { id: cacheKey });

	if (progress.complete) {
		console.log(`[Audio Cache] Cache hit: ${cacheKey}`);
		const arrayBuffer = await postMessage('read', { id: cacheKey });
		const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
		return URL.createObjectURL(blob);
	}

	const result = await getSignedUrlFn({ summaryId });
	const signedUrl = result.url;

	if (progress.downloadedBytes > 0 && progress.totalSize > 0) {
		const percent = ((progress.downloadedBytes / progress.totalSize) * 100).toFixed(1);
		console.log(
			`[Audio Cache] Incomplete download found: ${percent}% (${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalSize)})`
		);

		const testResponse = await fetch(signedUrl, {
			method: 'HEAD'
		});
		const acceptRanges = testResponse.headers.get('Accept-Ranges');

		if (acceptRanges === 'bytes') {
			await streamingDownload(cacheKey, signedUrl, progress.downloadedBytes);
		} else {
			console.log('[Audio Cache] Server does not support Range requests, restarting download');
			await postMessage('delete', { id: cacheKey });
			await streamingDownload(cacheKey, signedUrl, 0);
		}
	} else {
		console.log(`[Audio Cache] Cache miss: ${cacheKey}`);
		await streamingDownload(cacheKey, signedUrl, 0);
	}

	const arrayBuffer = await postMessage('read', { id: cacheKey });
	const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
	return URL.createObjectURL(blob);
}

/**
 * 캐시 삭제
 */
export async function clearAudioCache(summaryId) {
	const cacheKey = `${summaryId}-summary`;

	try {
		await postMessage('delete', { id: cacheKey });
		console.log(`[Audio Cache] Cleared: ${cacheKey}`);
	} catch (error) {
		console.error('[Audio Cache] Clear failed:', error);
	}
}

/**
 * 전체 캐시 정보 조회
 */
export async function getCacheInfo() {
	try {
		return await postMessage('list');
	} catch (error) {
		console.error('[Audio Cache] getCacheInfo failed:', error);
		return [];
	}
}
