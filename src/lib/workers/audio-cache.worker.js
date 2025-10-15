/**
 * OPFS Audio Cache Worker
 * - 모든 OPFS 작업을 Worker에서 처리
 * - createSyncAccessHandle() 사용
 * - Safari 16.4+, Chrome 108+, Firefox 111+ 지원
 */

const AUDIO_DIR = 'audio-cache';
const META_SUFFIX = '.meta.json';

/**
 * OPFS 루트 디렉토리 가져오기
 */
async function getOPFSRoot() {
	return await navigator.storage.getDirectory();
}

/**
 * 오디오 캐시 디렉토리 가져오기/생성
 */
async function getAudioDir() {
	const root = await getOPFSRoot();
	return await root.getDirectoryHandle(AUDIO_DIR, { create: true });
}

/**
 * 캐시 존재 확인
 */
async function handleHas(id) {
	try {
		const dir = await getAudioDir();
		await dir.getFileHandle(id);
		const metaHandle = await dir.getFileHandle(`${id}${META_SUFFIX}`);
		const metaFile = await metaHandle.getFile();
		const metaText = await metaFile.text();
		const meta = JSON.parse(metaText);

		return { success: true, data: meta.complete === true };
	} catch {
		return { success: true, data: false };
	}
}

/**
 * 다운로드 진행 상황 조회
 */
async function handleGetProgress(id) {
	try {
		const dir = await getAudioDir();
		const metaHandle = await dir.getFileHandle(`${id}${META_SUFFIX}`);
		const metaFile = await metaHandle.getFile();
		const metaText = await metaFile.text();
		const meta = JSON.parse(metaText);

		return {
			success: true,
			data: {
				complete: meta.complete || false,
				downloadedBytes: meta.downloadedBytes || 0,
				totalSize: meta.totalSize || 0,
				etag: meta.etag,
				lastModified: meta.lastModified
			}
		};
	} catch {
		return {
			success: true,
			data: {
				complete: false,
				downloadedBytes: 0,
				totalSize: 0
			}
		};
	}
}

/**
 * 다운로드 초기화
 */
async function handleInitDownload(id, metadata) {
	try {
		const dir = await getAudioDir();

		const fileHandle = await dir.getFileHandle(id, { create: true });
		const accessHandle = await fileHandle.createSyncAccessHandle();
		accessHandle.truncate(metadata.totalSize || 0);
		accessHandle.close();

		const metaHandle = await dir.getFileHandle(`${id}${META_SUFFIX}`, { create: true });
		const metaAccessHandle = await metaHandle.createSyncAccessHandle();
		const metaJson = JSON.stringify({
			complete: false,
			downloadedBytes: 0,
			totalSize: metadata.totalSize || 0,
			etag: metadata.etag,
			lastModified: metadata.lastModified,
			startedAt: Date.now(),
			updatedAt: Date.now()
		});
		const metaBuffer = new TextEncoder().encode(metaJson);
		metaAccessHandle.truncate(0);
		metaAccessHandle.write(metaBuffer, { at: 0 });
		metaAccessHandle.flush();
		metaAccessHandle.close();

		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 청크 쓰기
 */
async function handleWriteChunk(id, offset, buffer) {
	try {
		const dir = await getAudioDir();
		const fileHandle = await dir.getFileHandle(id, { create: true });
		const accessHandle = await fileHandle.createSyncAccessHandle();

		accessHandle.write(buffer, { at: offset });
		accessHandle.flush();
		accessHandle.close();

		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 메타데이터 업데이트
 */
async function handleUpdateMetadata(id, updates) {
	try {
		const dir = await getAudioDir();
		const metaHandle = await dir.getFileHandle(`${id}${META_SUFFIX}`);
		const metaFile = await metaHandle.getFile();
		const metaText = await metaFile.text();
		const meta = JSON.parse(metaText);

		const updatedMeta = {
			...meta,
			...updates,
			updatedAt: Date.now()
		};

		const metaAccessHandle = await metaHandle.createSyncAccessHandle();
		const metaJson = JSON.stringify(updatedMeta);
		const metaBuffer = new TextEncoder().encode(metaJson);
		metaAccessHandle.truncate(0);
		metaAccessHandle.write(metaBuffer, { at: 0 });
		metaAccessHandle.flush();
		metaAccessHandle.close();

		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 파일 읽기
 */
async function handleRead(id) {
	try {
		const dir = await getAudioDir();

		const metaHandle = await dir.getFileHandle(`${id}${META_SUFFIX}`);
		const metaFile = await metaHandle.getFile();
		const metaText = await metaFile.text();
		const meta = JSON.parse(metaText);

		if (!meta.complete) {
			throw new Error('File not complete');
		}

		const fileHandle = await dir.getFileHandle(id);
		const accessHandle = await fileHandle.createSyncAccessHandle();

		const size = accessHandle.getSize();
		const buffer = new ArrayBuffer(size);
		const view = new DataView(buffer);
		accessHandle.read(view, { at: 0 });
		accessHandle.close();

		return { success: true, data: buffer };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 파일 쓰기
 */
async function handleWrite(id, buffer, metadata) {
	try {
		const dir = await getAudioDir();

		const fileHandle = await dir.getFileHandle(id, { create: true });
		const accessHandle = await fileHandle.createSyncAccessHandle();

		accessHandle.truncate(0);
		accessHandle.write(buffer, { at: 0 });
		accessHandle.flush();
		accessHandle.close();

		const metaHandle = await dir.getFileHandle(`${id}${META_SUFFIX}`, { create: true });
		const metaAccessHandle = await metaHandle.createSyncAccessHandle();
		const metaJson = JSON.stringify({
			complete: true,
			savedAt: Date.now(),
			size: buffer.byteLength,
			...metadata
		});
		const metaBuffer = new TextEncoder().encode(metaJson);
		metaAccessHandle.truncate(0);
		metaAccessHandle.write(metaBuffer, { at: 0 });
		metaAccessHandle.flush();
		metaAccessHandle.close();

		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 파일 삭제
 */
async function handleDelete(id) {
	try {
		const dir = await getAudioDir();
		await dir.removeEntry(id).catch(() => {});
		await dir.removeEntry(`${id}${META_SUFFIX}`).catch(() => {});
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 전체 목록 조회
 */
async function handleList() {
	try {
		const dir = await getAudioDir();
		const entries = [];

		for await (const [name, handle] of dir.entries()) {
			if (handle.kind === 'file' && !name.endsWith(META_SUFFIX)) {
				try {
					const metaHandle = await dir.getFileHandle(`${name}${META_SUFFIX}`);
					const metaFile = await metaHandle.getFile();
					const metaText = await metaFile.text();
					const meta = JSON.parse(metaText);

					entries.push({
						id: name,
						size: meta.size,
						complete: meta.complete,
						savedAt: meta.savedAt
					});
				} catch {
					// 메타데이터 없으면 건너뛰기
				}
			}
		}

		return { success: true, data: entries };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 메시지 핸들러
 */
self.onmessage = async (event) => {
	const { action, id, buffer, metadata, messageId, offset, updates } = event.data;

	let result;

	try {
		switch (action) {
			case 'has':
				result = await handleHas(id);
				break;
			case 'read':
				result = await handleRead(id);
				break;
			case 'write':
				result = await handleWrite(id, buffer, metadata);
				break;
			case 'delete':
				result = await handleDelete(id);
				break;
			case 'list':
				result = await handleList();
				break;
			case 'getProgress':
				result = await handleGetProgress(id);
				break;
			case 'initDownload':
				result = await handleInitDownload(id, metadata);
				break;
			case 'writeChunk':
				result = await handleWriteChunk(id, offset, buffer);
				break;
			case 'updateMetadata':
				result = await handleUpdateMetadata(id, updates);
				break;
			default:
				result = { success: false, error: `Unknown action: ${action}` };
		}
	} catch (error) {
		result = { success: false, error: error.message };
	}

	self.postMessage({ messageId, ...result });
};
