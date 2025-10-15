/**
 * OPFS 기반 오디오 캐싱 유틸리티
 * - Stream tee로 재생 + 저장 동시 처리
 * - 임시 파일(.tmp) 검증 후 정식 저장
 * - 브라우저 자동 용량 관리
 */

const AUDIO_DIR = 'audio-cache';
const META_SUFFIX = '.meta.json';
const TEMP_SUFFIX = '.tmp';

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
 * 메타데이터 저장
 */
async function saveMetadata(summaryId, metadata) {
	const dir = await getAudioDir();
	const fileHandle = await dir.getFileHandle(`${summaryId}${META_SUFFIX}`, { create: true });
	const writable = await fileHandle.createWritable();
	await writable.write(JSON.stringify(metadata));
	await writable.close();
}

/**
 * 메타데이터 조회
 */
async function getMetadata(summaryId) {
	try {
		const dir = await getAudioDir();
		const fileHandle = await dir.getFileHandle(`${summaryId}${META_SUFFIX}`);
		const file = await fileHandle.getFile();
		const text = await file.text();
		return JSON.parse(text);
	} catch {
		return null;
	}
}

/**
 * OPFS에서 완전한 오디오 파일 로드
 */
async function loadFromOPFS(summaryId) {
	try {
		const dir = await getAudioDir();
		const meta = await getMetadata(summaryId);

		// 완전한 파일만 반환
		if (!meta?.complete) {
			return null;
		}

		const fileHandle = await dir.getFileHandle(summaryId);
		const file = await fileHandle.getFile();
		return file;
	} catch {
		return null;
	}
}

/**
 * Stream을 OPFS에 저장 (백그라운드)
 */
async function saveStreamToOPFS(summaryId, stream) {
	try {
		const dir = await getAudioDir();
		const tempFileName = `${summaryId}${TEMP_SUFFIX}`;

		// 1. 임시 파일로 저장
		const tempHandle = await dir.getFileHandle(tempFileName, { create: true });
		const writable = await tempHandle.createWritable();

		const reader = stream.getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			await writable.write(value);
		}
		await writable.close();

		// 2. 정식 파일로 rename (임시 → 정식)
		await dir.removeEntry(summaryId).catch(() => {}); // 기존 파일 삭제
		const finalHandle = await dir.getFileHandle(summaryId, { create: true });
		const finalWritable = await finalHandle.createWritable();

		const tempFile = await tempHandle.getFile();
		await finalWritable.write(await tempFile.arrayBuffer());
		await finalWritable.close();

		// 3. 임시 파일 삭제
		await dir.removeEntry(tempFileName).catch(() => {});

		// 4. 메타데이터 저장
		await saveMetadata(summaryId, {
			complete: true,
			savedAt: Date.now(),
			size: tempFile.size
		});

		console.log(`[OPFS] Saved audio: ${summaryId}`);
	} catch (error) {
		console.error('[OPFS] Save failed:', error);
		// 실패 시 임시 파일 정리
		try {
			const dir = await getAudioDir();
			await dir.removeEntry(`${summaryId}${TEMP_SUFFIX}`).catch(() => {});
			await dir.removeEntry(`${summaryId}${META_SUFFIX}`).catch(() => {});
		} catch {}
	}
}

/**
 * Summary 오디오 가져오기 (캐시 우선, 없으면 다운로드)
 * - 캐시가 있으면 즉시 반환 (서버 요청 없음)
 * - 없으면 서버에서 다운로드 + 백그라운드 캐싱
 *
 * @param {string} summaryId - Summary ID
 * @param {Function} getSignedUrlFn - Remote 함수 (클라이언트에서 전달)
 * @returns {Promise<string>} - <audio src>에 사용 가능한 blob URL
 */
export async function getSummaryAudio(summaryId, getSignedUrlFn) {
	const cacheKey = `${summaryId}-summary`;

	// 1. 캐시 확인 (OPFS)
	const cachedFile = await loadFromOPFS(cacheKey);
	if (cachedFile) {
		console.log(`[Audio Cache] Hit: ${cacheKey}`);
		return URL.createObjectURL(cachedFile);
	}

	console.log(`[Audio Cache] Miss: ${cacheKey}, downloading...`);

	// 2. Remote 함수로 Signed URL 요청
	const result = await getSignedUrlFn({ summaryId });
	const signedUrl = result.url;

	// 3. 다운로드
	const response = await fetch(signedUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch audio: ${response.statusText}`);
	}

	// 4. Stream tee: 재생용 + 저장용
	const [streamForPlay, streamForSave] = response.body.tee();

	// 5. 백그라운드로 OPFS 저장
	saveStreamToOPFS(cacheKey, streamForSave).catch((err) => {
		console.error('[Audio Cache] Background save failed:', err);
	});

	// 6. 재생용 Blob URL 반환
	const playBlob = await new Response(streamForPlay).blob();
	return URL.createObjectURL(playBlob);
}

/**
 * 캐시 삭제 (디버그용)
 */
export async function clearAudioCache(summaryId) {
	try {
		const dir = await getAudioDir();
		await dir.removeEntry(summaryId).catch(() => {});
		await dir.removeEntry(`${summaryId}${META_SUFFIX}`).catch(() => {});
		console.log(`[OPFS] Cleared cache: ${summaryId}`);
	} catch (error) {
		console.error('[OPFS] Clear failed:', error);
	}
}

/**
 * 전체 캐시 정보 조회 (디버그용)
 */
export async function getCacheInfo() {
	try {
		const dir = await getAudioDir();
		const entries = [];

		for await (const [name, handle] of dir.entries()) {
			if (handle.kind === 'file' && !name.endsWith(META_SUFFIX) && !name.endsWith(TEMP_SUFFIX)) {
				const file = await handle.getFile();
				const meta = await getMetadata(name);
				entries.push({
					id: name,
					size: file.size,
					complete: meta?.complete ?? false,
					savedAt: meta?.savedAt
				});
			}
		}

		return entries;
	} catch (error) {
		console.error('[OPFS] getCacheInfo failed:', error);
		return [];
	}
}
