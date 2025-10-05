import { z } from 'zod';

// URL 유효성 검사
/**
 * @param {string} str
 * @returns {boolean}
 */
const isValidUrl = (str) => {
	try {
		const url = new URL(str);
		return url.protocol === 'https:';
	} catch {
		// 프로토콜 없는 URL도 허용 (example.com 형식)
		if (!str.startsWith('http://') && !str.startsWith('https://')) {
			try {
				new URL(`https://${str}`);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	}
};

// URL 검증 스키마
export const urlSchema = z
	.string()
	.trim()
	.min(1, 'URL을 입력해주세요')
	.refine(isValidUrl, '지원하지 않는 URL 입니다');
