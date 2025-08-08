import { describe, it, expect, vi } from 'vitest';
import {
	validateYouTubeUrlFromForm,
	validateLanguageFromForm,
	isValidSubtitle,
	isValidSummaryData
} from '../../../src/lib/server/validation-utils.js';

describe('validation-utils', () => {
	describe('validateYouTubeUrlFromForm', () => {
		it('should validate correct YouTube URL', () => {
			const formData = new FormData();
			formData.append('youtubeUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

			expect(() => {
				validateYouTubeUrlFromForm(formData);
			}).not.toThrow();
		});

		it('should throw error for missing URL', () => {
			const formData = new FormData();

			expect(() => {
				validateYouTubeUrlFromForm(formData);
			}).toThrow('YouTube URL이 제공되지 않았습니다.');
		});

		it('should throw error for empty URL', () => {
			const formData = new FormData();
			formData.append('youtubeUrl', '');

			expect(() => {
				validateYouTubeUrlFromForm(formData);
			}).toThrow('YouTube URL이 제공되지 않았습니다.');
		});

		it('should throw error for invalid URL format', () => {
			const formData = new FormData();
			formData.append('youtubeUrl', 'not-a-url');

			expect(() => {
				validateYouTubeUrlFromForm(formData);
			}).toThrow('올바른 YouTube URL을 입력해주세요.');
		});

		it('should accept various YouTube URL formats', () => {
			const validUrls = [
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'https://youtube.com/watch?v=dQw4w9WgXcQ',
				'https://youtu.be/dQw4w9WgXcQ',
				'https://www.youtube.com/embed/dQw4w9WgXcQ',
				'https://m.youtube.com/watch?v=dQw4w9WgXcQ'
			];

			validUrls.forEach((url) => {
				const formData = new FormData();
				formData.append('youtubeUrl', url);

				expect(() => {
					validateYouTubeUrlFromForm(formData);
				}).not.toThrow();
			});
		});
	});

	describe('validateLanguageFromForm', () => {
		it('should return "ko" for Korean language', () => {
			const formData = new FormData();
			formData.append('lang', 'ko');

			const result = validateLanguageFromForm(formData);
			expect(result).toBe('ko');
		});

		it('should return "en" for English language', () => {
			const formData = new FormData();
			formData.append('lang', 'en');

			const result = validateLanguageFromForm(formData);
			expect(result).toBe('en');
		});

		it('should default to "ko" for missing language', () => {
			const formData = new FormData();

			const result = validateLanguageFromForm(formData);
			expect(result).toBe('ko');
		});

		it('should default to "ko" for invalid language', () => {
			const formData = new FormData();
			formData.append('lang', 'fr');

			const result = validateLanguageFromForm(formData);
			expect(result).toBe('ko');
		});
	});

	describe('isValidSubtitle', () => {
		it('should return true for valid subtitle string', () => {
			const subtitle = 'This is a valid subtitle content';
			expect(isValidSubtitle(subtitle)).toBe(true);
		});

		it('should return false for null subtitle', () => {
			expect(isValidSubtitle(null)).toBe(false);
		});

		it('should return false for undefined subtitle', () => {
			expect(isValidSubtitle(undefined)).toBe(false);
		});

		it('should return false for empty string', () => {
			expect(isValidSubtitle('')).toBe(false);
		});

		it('should return false for non-string types', () => {
			expect(isValidSubtitle(123)).toBe(false);
			expect(isValidSubtitle({})).toBe(false);
			expect(isValidSubtitle([])).toBe(false);
			expect(isValidSubtitle(true)).toBe(false);
		});

		it('should return true for whitespace-only strings', () => {
			expect(isValidSubtitle('   ')).toBe(true);
			expect(isValidSubtitle('\n\t')).toBe(true);
		});
	});

	describe('isValidSummaryData', () => {
		it('should return true for valid summary data', () => {
			const summaryData = {
				title: 'Test Title',
				summary: 'Test summary content',
				content: 'Full test content'
			};
			expect(isValidSummaryData(summaryData)).toBe(true);
		});

		it('should return false for null data', () => {
			expect(isValidSummaryData(null)).toBe(false);
		});

		it('should return false for undefined data', () => {
			expect(isValidSummaryData(undefined)).toBe(false);
		});

		it('should return false for missing title', () => {
			const summaryData = {
				summary: 'Test summary',
				content: 'Test content'
			};
			expect(isValidSummaryData(summaryData)).toBe(false);
		});

		it('should return false for missing summary', () => {
			const summaryData = {
				title: 'Test title',
				content: 'Test content'
			};
			expect(isValidSummaryData(summaryData)).toBe(false);
		});

		it('should return false for missing content', () => {
			const summaryData = {
				title: 'Test title',
				summary: 'Test summary'
			};
			expect(isValidSummaryData(summaryData)).toBe(false);
		});

		it('should return false for empty string values', () => {
			const summaryData = {
				title: '',
				summary: 'Test summary',
				content: 'Test content'
			};
			expect(isValidSummaryData(summaryData)).toBe(false);
		});

		it('should return true for whitespace-only strings', () => {
			const summaryData = {
				title: '   ',
				summary: 'Test summary',
				content: 'Test content'
			};
			expect(isValidSummaryData(summaryData)).toBe(true);
		});
	});
});
