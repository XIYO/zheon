import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSubtitle, validateLanguage } from '../../../src/lib/server/subtitle-service.js';

// Mock the pyExtractSubtitle module
vi.mock('../../../src/lib/server/pyExtractSubtitle.js', () => ({
	extractSubtitle: vi.fn()
}));

describe('subtitle-service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('processSubtitle', () => {
		it('should return valid subtitle string unchanged', () => {
			const subtitle = 'This is a valid subtitle content with timestamps.';
			const result = processSubtitle(subtitle);
			expect(result).toBe(subtitle);
		});

		it('should return multi-line subtitle content', () => {
			const subtitle = `Line 1: Hello world
Line 2: This is a test
Line 3: End of content`;
			const result = processSubtitle(subtitle);
			expect(result).toBe(subtitle);
		});

		it('should handle subtitle with special characters', () => {
			const subtitle = 'Subtitle with émojis 🎬 and spéciål çhars!';
			const result = processSubtitle(subtitle);
			expect(result).toBe(subtitle);
		});

		it('should throw error for null subtitle', () => {
			expect(() => {
				processSubtitle(null);
			}).toThrow('Subtitle is invalid or undefined.');
		});

		it('should throw error for undefined subtitle', () => {
			expect(() => {
				processSubtitle(undefined);
			}).toThrow('Subtitle is invalid or undefined.');
		});

		it('should throw error for empty string', () => {
			expect(() => {
				processSubtitle('');
			}).toThrow('Subtitle is invalid or undefined.');
		});

		it('should throw error for non-string types', () => {
			const invalidInputs = [123, {}, [], true, false];
			
			invalidInputs.forEach(input => {
				expect(() => {
					processSubtitle(input);
				}).toThrow('Subtitle is invalid or undefined.');
			});
		});

		it('should handle whitespace-only strings', () => {
			const whitespaceSubtitle = '   \n\t   ';
			const result = processSubtitle(whitespaceSubtitle);
			expect(result).toBe(whitespaceSubtitle);
		});

		it('should handle very long subtitle content', () => {
			const longSubtitle = 'A'.repeat(10000);
			const result = processSubtitle(longSubtitle);
			expect(result).toBe(longSubtitle);
		});
	});

	describe('validateLanguage', () => {
		it('should return "en" for English input', () => {
			const result = validateLanguage('en');
			expect(result).toBe('en');
		});

		it('should return "ko" for Korean input', () => {
			const result = validateLanguage('ko');
			expect(result).toBe('ko');
		});

		it('should default to "ko" for null input', () => {
			const result = validateLanguage(null);
			expect(result).toBe('ko');
		});

		it('should default to "ko" for undefined input', () => {
			const result = validateLanguage(undefined);
			expect(result).toBe('ko');
		});

		it('should default to "ko" for invalid language codes', () => {
			const invalidLangs = ['fr', 'de', 'es', 'ja', 'zh'];
			
			invalidLangs.forEach(lang => {
				const result = validateLanguage(lang);
				expect(result).toBe('ko');
			});
		});

		it('should default to "ko" for empty string', () => {
			const result = validateLanguage('');
			expect(result).toBe('ko');
		});

		it('should handle case sensitivity', () => {
			expect(validateLanguage('EN')).toBe('ko');
			expect(validateLanguage('En')).toBe('ko');
			expect(validateLanguage('KO')).toBe('ko');
			expect(validateLanguage('Ko')).toBe('ko');
		});

		it('should default to "ko" for non-string inputs', () => {
			const nonStringInputs = [123, {}, [], true, false];
			
			nonStringInputs.forEach(input => {
				const result = validateLanguage(input);
				expect(result).toBe('ko');
			});
		});

		it('should handle whitespace around language codes', () => {
			expect(validateLanguage(' en ')).toBe('ko');
			expect(validateLanguage('\ten\n')).toBe('ko');
		});
	});
});