/* eslint-disable @typescript-eslint/ban-ts-comment */
/// <reference types="@types/wicg-file-system-access" />

// @ts-nocheck - OPFS API types are not fully compatible with current TypeScript definitions
const AUDIO_DIR = 'audio-cache';
const META_SUFFIX = '.meta.json';

async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
	return await navigator.storage.getDirectory();
}

async function getAudioDir(): Promise<FileSystemDirectoryHandle> {
	const root = await getOPFSRoot();
	return await root.getDirectoryHandle(AUDIO_DIR, { create: true });
}

async function handleHas(
	id: string
): Promise<{ success: boolean; data?: boolean; error?: string }> {
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

async function handleGetProgress(id: string): Promise<any> {
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

async function handleInitDownload(id: string, metadata: any): Promise<any> {
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
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

async function handleWriteChunk(id: string, offset: number, buffer: Uint8Array): Promise<any> {
	try {
		const dir = await getAudioDir();
		const fileHandle = await dir.getFileHandle(id, { create: true });
		const accessHandle = await fileHandle.createSyncAccessHandle();

		accessHandle.write(buffer, { at: offset });
		accessHandle.flush();
		accessHandle.close();

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

async function handleUpdateMetadata(id: string, updates: Record<string, any>): Promise<any> {
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
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

async function handleRead(id: string): Promise<any> {
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
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

async function handleWrite(id: string, buffer: Uint8Array, metadata: any): Promise<any> {
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
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

async function handleDelete(id: string): Promise<any> {
	try {
		const dir = await getAudioDir();
		await dir.removeEntry(id).catch(() => {});
		await dir.removeEntry(`${id}${META_SUFFIX}`).catch(() => {});
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

async function handleList(): Promise<any> {
	try {
		const dir = await getAudioDir();
		const entries: any[] = [];

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
					// metadata 없으면 건너뛰기
				}
			}
		}

		return { success: true, data: entries };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

self.onmessage = async (event: MessageEvent) => {
	const { action, id, buffer, metadata, messageId, offset, updates } = event.data;

	let result: any;

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
	} catch (error: any) {
		result = { success: false, error: error.message };
	}

	self.postMessage({ messageId, ...result });
};
