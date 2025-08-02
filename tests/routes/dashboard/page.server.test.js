import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from '../../../src/routes/(main)/dashboard/+page.server.js';
import { 
	createMockSupabase, 
	createMockUser, 
	createMockFormData, 
	createMockUrl,
	createMockEvent,
	createMockLocals
} from '$lib/test-utils.js';

// Mock all the imported modules
vi.mock('$lib/server/summary-claude.js', () => ({
	summarizeTranscript: vi.fn()
}));

vi.mock('$lib/server/youtube-utils.js', () => ({
	validateAndNormalizeUrl: vi.fn()
}));

vi.mock('$lib/server/auth-utils.js', () => ({
	validateUser: vi.fn()
}));

vi.mock('$lib/server/error-utils.js', () => ({
	handleError: vi.fn(),
	handleSubtitleError: vi.fn()
}));

vi.mock('$lib/server/subtitle-service.js', () => ({
	getOrCacheSubtitle: vi.fn(),
	processSubtitle: vi.fn()
}));

vi.mock('$lib/server/summary-service.js', () => ({
	upsertSummary: vi.fn(),
	getExistingSummary: vi.fn()
}));

vi.mock('$lib/server/validation-utils.js', () => ({
	validateYouTubeUrlFromForm: vi.fn()
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data, type: 'failure' })),
	redirect: vi.fn((status, location) => { 
		const error = new Error(`Redirect to ${location}`);
		error.status = status;
		error.location = location;
		throw error;
	})
}));

describe('Dashboard Server Actions', () => {
	let mockSupabase;
	let mockUser;
	let mockUrl;

	beforeEach(() => {
		vi.clearAllMocks();
		
		mockSupabase = createMockSupabase();
		mockUser = createMockUser();
		mockUrl = createMockUrl('http://localhost:3000/dashboard');
	});

	describe('default action', () => {
		it('should redirect unauthenticated users to sign-in', async ({ validateUser }) => {
			const { validateUser: mockValidateUser } = await import('$lib/server/auth-utils.js');
			mockValidateUser.mockImplementation(() => {
				throw new Error('Redirect');
			});

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: null })
			};

			try {
				await actions.default(event);
			} catch (error) {
				expect(error.message).toMatch(/Redirect/);
			}

			expect(mockValidateUser).toHaveBeenCalledWith(null, mockUrl);
		});

		it('should fail with 400 for invalid YouTube URL', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { handleError } = await import('$lib/server/error-utils.js');
			const { fail } = await import('@sveltejs/kit');

			validateYouTubeUrlFromForm.mockImplementation(() => {
				throw new Error('Invalid YouTube URL');
			});

			handleError.mockReturnValue({
				message: 'Invalid YouTube URL',
				type: 'validation_error'
			});

			fail.mockReturnValue({ status: 400, data: { message: 'Invalid YouTube URL' } });

			const formData = createMockFormData({
				youtubeUrl: 'invalid-url'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result.status).toBe(400);
			expect(handleError).toHaveBeenCalled();
			expect(fail).toHaveBeenCalledWith(400, { message: 'Invalid YouTube URL', type: 'validation_error' });
		});

		it('should return existing summary from cache', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { validateAndNormalizeUrl } = await import('$lib/server/youtube-utils.js');
			const { getExistingSummary } = await import('$lib/server/summary-service.js');

			const mockSummary = {
				id: 'existing-summary-123',
				title: 'Cached Video Title',
				summary: 'Cached summary',
				youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			};

			validateYouTubeUrlFromForm.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			validateAndNormalizeUrl.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			getExistingSummary.mockResolvedValue(mockSummary);

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result).toEqual({
				summary: mockSummary,
				fromCache: true
			});

			expect(getExistingSummary).toHaveBeenCalledWith(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				mockUser.id,
				mockSupabase
			);
		});

		it('should create new summary when not cached', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { validateAndNormalizeUrl } = await import('$lib/server/youtube-utils.js');
			const { getExistingSummary, upsertSummary } = await import('$lib/server/summary-service.js');
			const { getOrCacheSubtitle, processSubtitle } = await import('$lib/server/subtitle-service.js');
			const { summarizeTranscript } = await import('$lib/server/summary-claude.js');

			const mockTranscript = 'This is a test video transcript content.';
			const mockSummaryResult = {
				title: 'New Video Title',
				summary: 'New summary content',
				content: 'Full new content'
			};
			const mockCreatedSummary = {
				id: 'new-summary-456',
				...mockSummaryResult,
				youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				user_id: mockUser.id
			};

			validateYouTubeUrlFromForm.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			validateAndNormalizeUrl.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			getExistingSummary.mockResolvedValue(null);
			getOrCacheSubtitle.mockResolvedValue({
				success: true,
				subtitle: mockTranscript
			});
			processSubtitle.mockReturnValue(mockTranscript);
			summarizeTranscript.mockResolvedValue(mockSummaryResult);
			upsertSummary.mockResolvedValue(mockCreatedSummary);

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result).toEqual({
				summary: mockCreatedSummary,
				fromCache: false
			});

			expect(getOrCacheSubtitle).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			expect(processSubtitle).toHaveBeenCalledWith(mockTranscript);
			expect(summarizeTranscript).toHaveBeenCalledWith(mockTranscript);
			expect(upsertSummary).toHaveBeenCalledWith(
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'ko',
				mockSummaryResult.title,
				mockSummaryResult.summary,
				mockSummaryResult.content,
				mockUser.id,
				mockSupabase
			);
		});

		it('should handle subtitle extraction failure', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { validateAndNormalizeUrl } = await import('$lib/server/youtube-utils.js');
			const { getExistingSummary } = await import('$lib/server/summary-service.js');
			const { getOrCacheSubtitle } = await import('$lib/server/subtitle-service.js');
			const { fail } = await import('@sveltejs/kit');

			validateYouTubeUrlFromForm.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			validateAndNormalizeUrl.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			getExistingSummary.mockResolvedValue(null);
			getOrCacheSubtitle.mockResolvedValue({
				success: false,
				error: {
					type: 'EXTRACTION_FAILED',
					message: 'Failed to extract subtitles'
				}
			});

			fail.mockReturnValue({ 
				status: 400, 
				data: { 
					message: 'Failed to extract subtitles',
					type: 'extraction_error'
				} 
			});

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result.status).toBe(400);
			expect(fail).toHaveBeenCalledWith(400, {
				message: 'Failed to extract subtitles',
				type: 'extraction_error'
			});
		});

		it('should handle rate limit errors with 429 status', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { validateAndNormalizeUrl } = await import('$lib/server/youtube-utils.js');
			const { getExistingSummary } = await import('$lib/server/summary-service.js');
			const { getOrCacheSubtitle } = await import('$lib/server/subtitle-service.js');
			const { fail } = await import('@sveltejs/kit');

			validateYouTubeUrlFromForm.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			validateAndNormalizeUrl.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			getExistingSummary.mockResolvedValue(null);
			getOrCacheSubtitle.mockResolvedValue({
				success: false,
				error: {
					type: 'RATE_LIMIT',
					message: 'Rate limit exceeded'
				}
			});

			fail.mockReturnValue({ 
				status: 429, 
				data: { 
					message: 'Rate limit exceeded',
					type: 'rate_limit',
					retryAfter: 300
				} 
			});

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result.status).toBe(429);
			expect(fail).toHaveBeenCalledWith(429, {
				message: 'Rate limit exceeded',
				type: 'rate_limit',
				retryAfter: 300
			});
		});

		it('should handle subtitle processing errors', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { validateAndNormalizeUrl } = await import('$lib/server/youtube-utils.js');
			const { getExistingSummary } = await import('$lib/server/summary-service.js');
			const { getOrCacheSubtitle, processSubtitle } = await import('$lib/server/subtitle-service.js');
			const { handleSubtitleError } = await import('$lib/server/error-utils.js');
			const { fail } = await import('@sveltejs/kit');

			validateYouTubeUrlFromForm.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			validateAndNormalizeUrl.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			getExistingSummary.mockResolvedValue(null);
			getOrCacheSubtitle.mockResolvedValue({
				success: true,
				subtitle: null // Invalid subtitle
			});
			processSubtitle.mockImplementation(() => {
				throw new Error('Invalid subtitle format');
			});
			handleSubtitleError.mockReturnValue({
				message: 'Invalid subtitle format',
				type: 'subtitle_error'
			});
			fail.mockReturnValue({ 
				status: 400, 
				data: { 
					message: 'Invalid subtitle format',
					type: 'subtitle_error'
				} 
			});

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result.status).toBe(400);
			expect(handleSubtitleError).toHaveBeenCalled();
			expect(fail).toHaveBeenCalledWith(400, {
				message: 'Invalid subtitle format',
				type: 'subtitle_error'
			});
		});

		it('should handle database save errors', async () => {
			const { validateYouTubeUrlFromForm } = await import('$lib/server/validation-utils.js');
			const { validateAndNormalizeUrl } = await import('$lib/server/youtube-utils.js');
			const { getExistingSummary, upsertSummary } = await import('$lib/server/summary-service.js');
			const { getOrCacheSubtitle, processSubtitle } = await import('$lib/server/subtitle-service.js');
			const { summarizeTranscript } = await import('$lib/server/summary-claude.js');
			const { handleError } = await import('$lib/server/error-utils.js');
			const { fail } = await import('@sveltejs/kit');

			const mockTranscript = 'This is a test video transcript content.';
			const mockSummaryResult = {
				title: 'New Video Title',
				summary: 'New summary content',
				content: 'Full new content'
			};

			validateYouTubeUrlFromForm.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			validateAndNormalizeUrl.mockReturnValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
			getExistingSummary.mockResolvedValue(null);
			getOrCacheSubtitle.mockResolvedValue({
				success: true,
				subtitle: mockTranscript
			});
			processSubtitle.mockReturnValue(mockTranscript);
			summarizeTranscript.mockResolvedValue(mockSummaryResult);
			upsertSummary.mockRejectedValue(new Error('Database connection failed'));
			handleError.mockReturnValue({
				message: 'Database connection failed',
				type: 'database_error'
			});
			fail.mockReturnValue({ 
				status: 500, 
				data: { 
					message: 'Database connection failed',
					type: 'database_error'
				} 
			});

			const formData = createMockFormData({
				youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			});

			const request = new Request('http://localhost:3000/dashboard', {
				method: 'POST',
				body: formData
			});

			const event = {
				url: mockUrl,
				request,
				locals: createMockLocals({ user: mockUser, supabase: mockSupabase })
			};

			const result = await actions.default(event);

			expect(result.status).toBe(500);
			expect(handleError).toHaveBeenCalled();
			expect(fail).toHaveBeenCalledWith(500, {
				message: 'Database connection failed',
				type: 'database_error'
			});
		});
	});
});