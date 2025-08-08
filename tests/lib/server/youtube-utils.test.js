import { describe, it, expect } from 'vitest';
import {
	normalizeYouTubeUrl,
	validateAndNormalizeUrl,
	extractVideoId
} from '../../../src/lib/server/youtube-utils.js';

describe('youtube-utils', () => {
	describe('extractVideoId', () => {
		it('should extract video ID from standard YouTube URL', () => {
			const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
			expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
		});

		it('should extract video ID from youtu.be URL', () => {
			const url = 'https://youtu.be/dQw4w9WgXcQ';
			expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
		});

		it('should extract video ID from embed URL', () => {
			const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
			expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
		});

		it('should extract video ID from mobile URL', () => {
			const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
			expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
		});

		it('should handle URLs with additional parameters', () => {
			const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLxyz';
			expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
		});

		it('should handle URLs with timestamp in youtu.be format', () => {
			const url = 'https://youtu.be/dQw4w9WgXcQ?t=30';
			expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
		});

		it('should return null for invalid URLs', () => {
			expect(extractVideoId('not-a-url')).toBe(null);
			expect(extractVideoId('https://example.com')).toBe(null);
			expect(extractVideoId('https://youtube.com')).toBe(null);
		});

		it('should return null for empty or null input', () => {
			expect(extractVideoId('')).toBe(null);
			expect(extractVideoId(null)).toBe(null);
			expect(extractVideoId(undefined)).toBe(null);
		});
	});

	describe('normalizeYouTubeUrl', () => {
		it('should normalize standard YouTube URL', () => {
			const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s';
			const normalized = normalizeYouTubeUrl(url);
			expect(normalized).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});

		it('should normalize youtu.be URL', () => {
			const url = 'https://youtu.be/dQw4w9WgXcQ?t=30';
			const normalized = normalizeYouTubeUrl(url);
			expect(normalized).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});

		it('should normalize embed URL', () => {
			const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
			const normalized = normalizeYouTubeUrl(url);
			expect(normalized).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});

		it('should normalize mobile URL', () => {
			const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
			const normalized = normalizeYouTubeUrl(url);
			expect(normalized).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});

		it('should handle HTTP URLs', () => {
			const url = 'http://www.youtube.com/watch?v=dQw4w9WgXcQ';
			const normalized = normalizeYouTubeUrl(url);
			expect(normalized).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});

		it('should preserve video ID case sensitivity', () => {
			const url = 'https://www.youtube.com/watch?v=AbC123XyZ';
			const normalized = normalizeYouTubeUrl(url);
			expect(normalized).toBe('https://www.youtube.com/watch?v=AbC123XyZ');
		});
	});

	describe('validateAndNormalizeUrl', () => {
		it('should validate and normalize valid YouTube URL', () => {
			const url = 'https://youtu.be/dQw4w9WgXcQ?t=30';
			const result = validateAndNormalizeUrl(url);
			expect(result).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});

		it('should throw error for invalid URL', () => {
			expect(() => {
				validateAndNormalizeUrl('not-a-url');
			}).toThrow('올바른 YouTube URL을 입력해주세요.');
		});

		it('should throw error for non-YouTube URL', () => {
			expect(() => {
				validateAndNormalizeUrl('https://vimeo.com/123456789');
			}).toThrow('올바른 YouTube URL을 입력해주세요.');
		});

		it('should throw error for empty URL', () => {
			expect(() => {
				validateAndNormalizeUrl('');
			}).toThrow('YouTube URL이 제공되지 않았습니다.');
		});

		it('should throw error for null URL', () => {
			expect(() => {
				validateAndNormalizeUrl(null);
			}).toThrow('YouTube URL이 제공되지 않았습니다.');
		});

		it('should handle various valid YouTube URL formats', () => {
			const validUrls = [
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'https://youtube.com/watch?v=dQw4w9WgXcQ',
				'https://youtu.be/dQw4w9WgXcQ',
				'https://www.youtube.com/embed/dQw4w9WgXcQ',
				'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
				'http://www.youtube.com/watch?v=dQw4w9WgXcQ'
			];

			validUrls.forEach((url) => {
				expect(() => {
					validateAndNormalizeUrl(url);
				}).not.toThrow();
			});
		});

		it('should normalize all valid formats to standard format', () => {
			const testCases = [
				{
					input: 'https://youtu.be/dQw4w9WgXcQ',
					expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
				},
				{
					input: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
					expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
				},
				{
					input: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
					expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
				},
				{
					input: 'http://youtube.com/watch?v=dQw4w9WgXcQ',
					expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
				}
			];

			testCases.forEach(({ input, expected }) => {
				const result = validateAndNormalizeUrl(input);
				expect(result).toBe(expected);
			});
		});
	});
});
