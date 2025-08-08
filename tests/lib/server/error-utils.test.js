import { describe, it, expect } from 'vitest';
import {
	handleError,
	handleSubtitleError,
	handleDatabaseError
} from '../../../src/lib/server/error-utils.js';

describe('error-utils', () => {
	describe('handleError', () => {
		it('should handle Error objects with message', () => {
			const error = new Error('Test error message');
			const result = handleError(error);

			expect(result).toEqual({
				message: 'Test error message',
				type: 'validation_error'
			});
		});

		it('should handle string errors', () => {
			const error = 'String error message';
			const result = handleError(error);

			expect(result).toEqual({
				message: 'String error message',
				type: 'validation_error'
			});
		});

		it('should handle objects with message property', () => {
			const error = { message: 'Object error message' };
			const result = handleError(error);

			expect(result).toEqual({
				message: 'Object error message',
				type: 'validation_error'
			});
		});

		it('should handle objects with error property', () => {
			const error = { error: 'Object error property' };
			const result = handleError(error);

			expect(result).toEqual({
				message: 'Object error property',
				type: 'validation_error'
			});
		});

		it('should provide default message for unknown error types', () => {
			const error = { unknownProperty: 'value' };
			const result = handleError(error);

			expect(result).toEqual({
				message: '알 수 없는 오류가 발생했습니다.',
				type: 'unknown_error'
			});
		});

		it('should handle null and undefined errors', () => {
			expect(handleError(null)).toEqual({
				message: '알 수 없는 오류가 발생했습니다.',
				type: 'unknown_error'
			});

			expect(handleError(undefined)).toEqual({
				message: '알 수 없는 오류가 발생했습니다.',
				type: 'unknown_error'
			});
		});

		it('should preserve error type when present', () => {
			const error = {
				message: 'Custom error message',
				type: 'custom_error_type'
			};
			const result = handleError(error);

			expect(result).toEqual({
				message: 'Custom error message',
				type: 'custom_error_type'
			});
		});
	});

	describe('handleSubtitleError', () => {
		it('should handle subtitle-specific errors', () => {
			const error = new Error('Subtitle extraction failed');
			const result = handleSubtitleError(error);

			expect(result).toEqual({
				message: 'Subtitle extraction failed',
				type: 'subtitle_error'
			});
		});

		it('should provide subtitle-specific default message', () => {
			const result = handleSubtitleError(null);

			expect(result).toEqual({
				message: '자막 처리 중 오류가 발생했습니다.',
				type: 'subtitle_error'
			});
		});

		it('should handle various subtitle error formats', () => {
			const testCases = [
				{
					input: 'No subtitles available',
					expected: { message: 'No subtitles available', type: 'subtitle_error' }
				},
				{
					input: { message: 'Invalid subtitle format' },
					expected: { message: 'Invalid subtitle format', type: 'subtitle_error' }
				},
				{
					input: new Error('Network error during subtitle fetch'),
					expected: { message: 'Network error during subtitle fetch', type: 'subtitle_error' }
				}
			];

			testCases.forEach(({ input, expected }) => {
				const result = handleSubtitleError(input);
				expect(result).toEqual(expected);
			});
		});
	});

	describe('handleDatabaseError', () => {
		it('should handle database errors with default operation', () => {
			const error = new Error('Connection timeout');
			const result = handleDatabaseError(error);

			expect(result).toEqual({
				message: 'Connection timeout',
				type: 'database_error',
				operation: 'database operation'
			});
		});

		it('should handle database errors with custom operation', () => {
			const error = new Error('Unique constraint violation');
			const result = handleDatabaseError(error, 'user creation');

			expect(result).toEqual({
				message: 'Unique constraint violation',
				type: 'database_error',
				operation: 'user creation'
			});
		});

		it('should provide database-specific default message', () => {
			const result = handleDatabaseError(null, 'data retrieval');

			expect(result).toEqual({
				message: '데이터베이스 오류가 발생했습니다.',
				type: 'database_error',
				operation: 'data retrieval'
			});
		});

		it('should handle Supabase-style errors', () => {
			const supabaseError = {
				message: 'Row not found',
				code: 'PGRST116',
				details: 'The result contains 0 rows'
			};

			const result = handleDatabaseError(supabaseError, 'summary lookup');

			expect(result).toEqual({
				message: 'Row not found',
				type: 'database_error',
				operation: 'summary lookup'
			});
		});

		it('should handle various database error formats', () => {
			const testCases = [
				{
					input: 'Database connection failed',
					operation: 'connection',
					expected: {
						message: 'Database connection failed',
						type: 'database_error',
						operation: 'connection'
					}
				},
				{
					input: { error: 'Permission denied' },
					operation: 'user update',
					expected: {
						message: 'Permission denied',
						type: 'database_error',
						operation: 'user update'
					}
				}
			];

			testCases.forEach(({ input, operation, expected }) => {
				const result = handleDatabaseError(input, operation);
				expect(result).toEqual(expected);
			});
		});
	});
});
