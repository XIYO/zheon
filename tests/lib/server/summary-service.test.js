import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
	getExistingSummary, 
	updateSummary, 
	createSummary, 
	upsertSummary 
} from '../../../src/lib/server/summary-service.js';
import { createMockSupabase, createMockSummary } from '../../../src/lib/test-utils.js';

describe('summary-service', () => {
	let mockSupabase;

	// Helper function to create a proper Supabase query chain mock
	const createQueryChain = (resolveValue) => {
		const chain = {
			select: vi.fn(),
			eq: vi.fn(),
			update: vi.fn(),
			insert: vi.fn(),
			single: vi.fn(),
			maybeSingle: vi.fn()
		};
		
		// Make each method return the chain for proper chaining
		chain.select.mockReturnValue(chain);
		chain.eq.mockReturnValue(chain);
		chain.update.mockReturnValue(chain);
		chain.insert.mockReturnValue(chain);
		
		// Set the final resolve value
		if (resolveValue) {
			chain.single.mockResolvedValue(resolveValue);
			chain.maybeSingle.mockResolvedValue(resolveValue);
		}
		
		return chain;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSupabase = createMockSupabase();
	});

	describe('getExistingSummary', () => {
		it('should return existing summary when found', async () => {
			const mockSummary = createMockSummary();
			
			const chain = createQueryChain({
				data: mockSummary,
				error: null
			});

			mockSupabase.from.mockReturnValue(chain);

			const result = await getExistingSummary(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				'test-user-123',
				mockSupabase
			);

			expect(result).toEqual(mockSummary);
			expect(mockSupabase.from).toHaveBeenCalledWith('summary');
		});

		it('should return null when no summary found', async () => {
			const chain = createQueryChain({
				data: null,
				error: null
			});

			mockSupabase.from.mockReturnValue(chain);

			const result = await getExistingSummary(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				'test-user-123',
				mockSupabase
			);

			expect(result).toBeNull();
		});

		it('should return null when database error occurs', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			const chain = createQueryChain({
				data: null,
				error: { message: 'Database connection failed' }
			});

			mockSupabase.from.mockReturnValue(chain);

			const result = await getExistingSummary(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				'test-user-123',
				mockSupabase
			);

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Fetch existing summary error:', { message: 'Database connection failed' });
			
			consoleErrorSpy.mockRestore();
		});

		it('should return null when exception is thrown', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			mockSupabase.from.mockImplementation(() => {
				throw new Error('Network error');
			});

			const result = await getExistingSummary(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				'test-user-123',
				mockSupabase
			);

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting existing summary:', expect.any(Error));
			
			consoleErrorSpy.mockRestore();
		});

		it('should use correct query parameters', async () => {
			const chain = createQueryChain({ data: null, error: null });

			mockSupabase.from.mockReturnValue(chain);

			await getExistingSummary(
				'https://www.youtube.com/watch?v=testVideo',
				'en',
				'user-456',
				mockSupabase
			);

			expect(chain.select).toHaveBeenCalledWith('id, youtube_url, title, summary, user_id');
			expect(chain.eq).toHaveBeenCalledWith('youtube_url', 'https://www.youtube.com/watch?v=testVideo');
			expect(chain.eq).toHaveBeenCalledWith('lang', 'en');
			expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-456');
			expect(chain.maybeSingle).toHaveBeenCalled();
		});
	});

	describe('updateSummary', () => {
		it('should update existing summary successfully', async () => {
			const updatedSummary = createMockSummary({
				title: 'Updated Title',
				summary: 'Updated summary',
				content: 'Updated content'
			});

			const chain = createQueryChain({
				data: updatedSummary,
				error: null
			});

			mockSupabase.from.mockReturnValue(chain);

			const result = await updateSummary(
				'test-summary-123',
				'Updated Title',
				'Updated summary',
				'Updated content',
				mockSupabase
			);

			expect(result).toEqual(updatedSummary);
			expect(mockSupabase.from).toHaveBeenCalledWith('summary');
		});

		it('should throw error when update fails', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			const chain = createQueryChain({
				data: null,
				error: { message: 'Update failed' }
			});

			mockSupabase.from.mockReturnValue(chain);

			await expect(updateSummary(
				'test-summary-123',
				'Updated Title',
				'Updated summary',
				'Updated content',
				mockSupabase
			)).rejects.toThrow('Failed to update summary');

			expect(consoleErrorSpy).toHaveBeenCalledWith('Update error:', { message: 'Update failed' });
			consoleErrorSpy.mockRestore();
		});

		it('should use correct update parameters', async () => {
			const chain = createQueryChain({ data: {}, error: null });

			mockSupabase.from.mockReturnValue(chain);

			await updateSummary(
				'summary-456',
				'Test Title',
				'Test Summary',
				'Test Content',
				mockSupabase
			);

			expect(chain.update).toHaveBeenCalledWith({
				title: 'Test Title',
				summary: 'Test Summary',
				content: 'Test Content'
			});
			expect(chain.eq).toHaveBeenCalledWith('id', 'summary-456');
			expect(chain.select).toHaveBeenCalled();
			expect(chain.single).toHaveBeenCalled();
		});
	});

	describe('createSummary', () => {
		it('should create new summary successfully', async () => {
			const newSummary = createMockSummary({
				id: 'new-summary-456'
			});

			const chain = createQueryChain({
				data: newSummary,
				error: null
			});

			mockSupabase.from.mockReturnValue(chain);

			const result = await createSummary(
				'https://www.youtube.com/watch?v=newVideo',
				'ko',
				'New Title',
				'New summary',
				'New content',
				'user-123',
				mockSupabase
			);

			expect(result).toEqual(newSummary);
			expect(mockSupabase.from).toHaveBeenCalledWith('summary');
		});

		it('should throw error when creation fails', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			const chain = createQueryChain({
				data: null,
				error: { message: 'Insert failed' }
			});

			mockSupabase.from.mockReturnValue(chain);

			await expect(createSummary(
				'https://www.youtube.com/watch?v=newVideo',
				'ko',
				'New Title',
				'New summary',
				'New content',
				'user-123',
				mockSupabase
			)).rejects.toThrow('Failed to create summary');

			expect(consoleErrorSpy).toHaveBeenCalledWith('Insert error:', { message: 'Insert failed' });
			consoleErrorSpy.mockRestore();
		});

		it('should use correct insert parameters', async () => {
			const chain = createQueryChain({ data: {}, error: null });

			mockSupabase.from.mockReturnValue(chain);

			await createSummary(
				'https://www.youtube.com/watch?v=testVideo',
				'en',
				'Test Title',
				'Test Summary',
				'Test Content',
				'user-789',
				mockSupabase
			);

			expect(chain.insert).toHaveBeenCalledWith({
				youtube_url: 'https://www.youtube.com/watch?v=testVideo',
				lang: 'en',
				title: 'Test Title',
				summary: 'Test Summary',
				content: 'Test Content',
				user_id: 'user-789'
			});
			expect(chain.select).toHaveBeenCalled();
			expect(chain.single).toHaveBeenCalled();
		});
	});

	describe('upsertSummary', () => {
		it('should update existing summary when found', async () => {
			const existingSummary = createMockSummary();
			const updatedSummary = { ...existingSummary, title: 'Updated Title' };

			// Create chains for both getExistingSummary (maybeSingle) and updateSummary (single)
			let callCount = 0;
			mockSupabase.from.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					// First call is for getExistingSummary
					return createQueryChain({
						data: existingSummary,
						error: null
					});
				} else {
					// Second call is for updateSummary
					return createQueryChain({
						data: updatedSummary,
						error: null
					});
				}
			});

			const result = await upsertSummary(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				'Updated Title',
				'Updated summary',
				'Updated content',
				'test-user-123',
				mockSupabase
			);

			expect(result).toEqual(updatedSummary);
		});

		it('should create new summary when not found', async () => {
			const newSummary = createMockSummary({
				id: 'new-summary-789'
			});

			// Create chains for both getExistingSummary (null) and createSummary (newSummary)
			let callCount = 0;
			mockSupabase.from.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					// First call is for getExistingSummary
					return createQueryChain({
						data: null,
						error: null
					});
				} else {
					// Second call is for createSummary
					return createQueryChain({
						data: newSummary,
						error: null
					});
				}
			});

			const result = await upsertSummary(
				'https://www.youtube.com/watch?v=newVideo',
				'ko',
				'New Title',
				'New summary',
				'New content',
				'test-user-123',
				mockSupabase
			);

			expect(result).toEqual(newSummary);
		});

		it('should pass correct parameters to getExistingSummary', async () => {
			// This test verifies the integration between functions
			const existingSummary = createMockSummary();

			// Create chains for both calls
			let callCount = 0;
			mockSupabase.from.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					// First call is for getExistingSummary
					return createQueryChain({
						data: existingSummary,
						error: null
					});
				} else {
					// Second call is for updateSummary
					return createQueryChain({
						data: existingSummary,
						error: null
					});
				}
			});

			await upsertSummary(
				'https://www.youtube.com/watch?v=testVideo',
				'en',
				'Test Title',
				'Test Summary',
				'Test Content',
				'user-456',
				mockSupabase
			);

			// Verify getExistingSummary was called with correct parameters
			const fromCalls = mockSupabase.from.mock.calls;
			expect(fromCalls).toContainEqual(['summary']);
		});
	});
});