import { describe, it, expect } from 'vitest';
import { urlSchema } from './url.js';

describe('urlSchema', () => {
	describe('valid URLs', () => {
		it('accepts HTTPS URLs with protocol', () => {
			const result = urlSchema.safeParse('https://example.com');
			expect(result.success).toBe(true);
			expect(result.data).toBe('https://example.com');
		});

		it('accepts HTTPS URLs with www', () => {
			const result = urlSchema.safeParse('https://www.example.com');
			expect(result.success).toBe(true);
		});

		it('accepts URLs without protocol (adds https)', () => {
			const result = urlSchema.safeParse('example.com');
			expect(result.success).toBe(true);
		});

		it('accepts URLs with paths', () => {
			const result = urlSchema.safeParse('https://example.com/path/to/page');
			expect(result.success).toBe(true);
		});

		it('accepts URLs with query parameters', () => {
			const result = urlSchema.safeParse('https://example.com?param=value');
			expect(result.success).toBe(true);
		});

		it('accepts YouTube URLs', () => {
			const result = urlSchema.safeParse('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			expect(result.success).toBe(true);
		});

		it('accepts short YouTube URLs', () => {
			const result = urlSchema.safeParse('https://youtu.be/dQw4w9WgXcQ');
			expect(result.success).toBe(true);
		});
	});

	describe('invalid URLs', () => {
		it('rejects empty string', () => {
			const result = urlSchema.safeParse('');
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe('URL을 입력해주세요');
		});

		it('rejects HTTP URLs', () => {
			const result = urlSchema.safeParse('http://example.com');
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe('지원하지 않는 URL 입니다');
		});

		it('rejects invalid URL format', () => {
			const result = urlSchema.safeParse('not a url');
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe('지원하지 않는 URL 입니다');
		});

		it('rejects javascript: protocol', () => {
			const result = urlSchema.safeParse('javascript:alert(1)');
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe('지원하지 않는 URL 입니다');
		});

		it('rejects file: protocol', () => {
			const result = urlSchema.safeParse('file:///etc/passwd');
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe('지원하지 않는 URL 입니다');
		});

		it('rejects whitespace only', () => {
			const result = urlSchema.safeParse('   ');
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe('URL을 입력해주세요');
		});
	});

	describe('error message format', () => {
		it('returns correct error structure for empty input', () => {
			const result = urlSchema.safeParse('');
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.issues).toBeDefined();
			expect(result.error?.issues.length).toBeGreaterThan(0);
			expect(result.error?.issues[0]).toHaveProperty('message');
		});

		it('returns correct error structure for invalid URL', () => {
			const result = urlSchema.safeParse('not a url at all!');
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.issues).toBeDefined();
			expect(result.error?.issues.length).toBeGreaterThan(0);
			expect(result.error?.issues[0]).toHaveProperty('message');
		});
	});
});
