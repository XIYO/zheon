import { logger } from '$lib/logger';

let worker: Worker | null = null;
let messageId = 0;
const pendingMessages = new Map<
	number,
	{ resolve: (_value: unknown) => void; reject: (_reason?: unknown) => void }
>();

interface WorkerMessage {
	messageId: number;
	success: boolean;
	data?: unknown;
	error?: string;
}

function getWorker(): Worker {
	if (worker) return worker;

	worker = new Worker(new URL('../workers/audio-cache.worker.js', import.meta.url), {
		type: 'module'
	});

	worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
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

	worker.onerror = (error: Event | ErrorEvent) => {
		logger.error('[Audio Cache] Worker error:', error);
	};

	return worker;
}

function postMessage(action: string, data: Record<string, unknown> = {}): Promise<unknown> {
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

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function streamingDownload(
	cacheKey: string,
	signedUrl: string,
	startOffset = 0
): Promise<void> {
	const headers: Record<string, string> = {};
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
		logger.info(`[Audio Cache] Starting download: ${formatBytes(totalSize)}`);
		await postMessage('initDownload', {
			id: cacheKey,
			metadata: { totalSize, etag, lastModified }
		});
	} else {
		const remaining = totalSize - startOffset;
		logger.info(
			`[Audio Cache] Resuming download: ${formatBytes(startOffset)} / ${formatBytes(totalSize)} (${formatBytes(remaining)} remaining)`
		);
	}

	const reader = response.body!.getReader();
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
			logger.info(
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

	logger.info(`[Audio Cache] Download complete: ${formatBytes(totalSize)}`);
}

export async function getSummaryAudio(
	summaryId: string,
	_getSignedUrlFn: (_params: { summaryId: string }) => Promise<{ url: string }>
): Promise<string> {
	const getSignedUrlFn = _getSignedUrlFn;
	const cacheKey = `${summaryId}-summary`;

	const progress = (await postMessage('getProgress', { id: cacheKey })) as {
		complete: boolean;
		downloadedBytes: number;
		totalSize: number;
	};

	if (progress.complete) {
		logger.info(`[Audio Cache] Cache hit: ${cacheKey}`);
		const arrayBuffer = (await postMessage('read', { id: cacheKey })) as ArrayBuffer;
		const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
		return URL.createObjectURL(blob);
	}

	const result = await getSignedUrlFn({ summaryId });
	const signedUrl = result.url;

	if (progress.downloadedBytes > 0 && progress.totalSize > 0) {
		const percent = ((progress.downloadedBytes / progress.totalSize) * 100).toFixed(1);
		logger.info(
			`[Audio Cache] Incomplete download found: ${percent}% (${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalSize)})`
		);

		const testResponse = await fetch(signedUrl, {
			method: 'HEAD'
		});
		const acceptRanges = testResponse.headers.get('Accept-Ranges');

		if (acceptRanges === 'bytes') {
			await streamingDownload(cacheKey, signedUrl, progress.downloadedBytes);
		} else {
			logger.info('[Audio Cache] Server does not support Range requests, restarting download');
			await postMessage('delete', { id: cacheKey });
			await streamingDownload(cacheKey, signedUrl, 0);
		}
	} else {
		logger.info(`[Audio Cache] Cache miss: ${cacheKey}`);
		await streamingDownload(cacheKey, signedUrl, 0);
	}

	const arrayBuffer = (await postMessage('read', { id: cacheKey })) as ArrayBuffer;
	const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
	return URL.createObjectURL(blob);
}

export async function clearAudioCache(summaryId: string): Promise<void> {
	const cacheKey = `${summaryId}-summary`;

	try {
		await postMessage('delete', { id: cacheKey });
		logger.info(`[Audio Cache] Cleared: ${cacheKey}`);
	} catch (error) {
		logger.error('[Audio Cache] Clear failed:', error);
	}
}

export async function getCacheInfo(): Promise<any[]> {
	try {
		return await postMessage('list');
	} catch (error) {
		logger.error('[Audio Cache] getCacheInfo failed:', error);
		return [];
	}
}
