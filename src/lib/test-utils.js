import { vi } from 'vitest';

/**
 * Testing utilities for Zheon application
 */

/**
 * Creates a mock Supabase client for testing
 * @param {Object} overrides - Override specific methods
 * @returns {Object} Mock Supabase client
 */
export function createMockSupabase(overrides = {}) {
	const defaultMock = {
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			neq: vi.fn().mockReturnThis(),
			gt: vi.fn().mockReturnThis(),
			lt: vi.fn().mockReturnThis(),
			gte: vi.fn().mockReturnThis(),
			lte: vi.fn().mockReturnThis(),
			like: vi.fn().mockReturnThis(),
			ilike: vi.fn().mockReturnThis(),
			is: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			contains: vi.fn().mockReturnThis(),
			containedBy: vi.fn().mockReturnThis(),
			overlaps: vi.fn().mockReturnThis(),
			textSearch: vi.fn().mockReturnThis(),
			match: vi.fn().mockReturnThis(),
			not: vi.fn().mockReturnThis(),
			or: vi.fn().mockReturnThis(),
			and: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			range: vi.fn().mockReturnThis(),
			single: vi.fn(() => Promise.resolve({ data: null, error: null })),
			maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
			then: vi.fn((callback) => callback({ data: [], error: null }))
		})),
		auth: {
			getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
			getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
			signIn: vi.fn(() => Promise.resolve({ data: {}, error: null })),
			signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
			signOut: vi.fn(() => Promise.resolve({ error: null })),
			onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
		},
		channel: vi.fn(() => ({
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn()
		})),
		removeChannel: vi.fn()
	};

	return { ...defaultMock, ...overrides };
}

/**
 * Creates a mock user object for testing
 * @param {Object} overrides - Override specific user properties
 * @returns {Object} Mock user object
 */
export function createMockUser(overrides = {}) {
	return {
		id: 'test-user-123',
		email: 'test@example.com',
		user_metadata: {
			full_name: 'Test User',
			avatar_url: 'https://example.com/avatar.jpg'
		},
		app_metadata: {},
		aud: 'authenticated',
		created_at: '2024-01-01T00:00:00Z',
		...overrides
	};
}

/**
 * Creates a mock summary object for testing
 * @param {Object} overrides - Override specific summary properties
 * @returns {Object} Mock summary object
 */
export function createMockSummary(overrides = {}) {
	return {
		id: 'test-summary-123',
		title: 'Test Video Title',
		summary: 'This is a test summary of the video content.',
		content: 'This is the full test content of the video transcript with detailed information.',
		youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		lang: 'ko',
		user_id: 'test-user-123',
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z',
		...overrides
	};
}

/**
 * Creates mock FormData for testing form submissions
 * @param {Object} data - Key-value pairs to add to FormData
 * @returns {FormData} Mock FormData object
 */
export function createMockFormData(data = {}) {
	const formData = new FormData();
	Object.entries(data).forEach(([key, value]) => {
		formData.append(key, value);
	});
	return formData;
}

/**
 * Creates a mock URL object for testing
 * @param {string} url - URL string
 * @param {Object} searchParams - Additional search parameters
 * @returns {URL} Mock URL object
 */
export function createMockUrl(url = 'http://localhost:3000', searchParams = {}) {
	const urlObj = new URL(url);
	Object.entries(searchParams).forEach(([key, value]) => {
		urlObj.searchParams.set(key, value);
	});
	return urlObj;
}

/**
 * Creates a mock fetch response for testing API calls
 * @param {*} data - Response data
 * @param {Object} options - Response options (status, headers, etc.)
 * @returns {Promise<Response>} Mock fetch response
 */
export function createMockFetchResponse(data, options = {}) {
	const { status = 200, statusText = 'OK', headers = {}, ok = status >= 200 && status < 300 } = options;
	
	return Promise.resolve({
		ok,
		status,
		statusText,
		headers: new Headers(headers),
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
		blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
	});
}

/**
 * Mocks the global fetch function
 * @param {*} data - Response data
 * @param {Object} options - Response options
 */
export function mockFetch(data, options = {}) {
	global.fetch = vi.fn(() => createMockFetchResponse(data, options));
}

/**
 * Creates a mock error object for testing error handling
 * @param {string} message - Error message
 * @param {string} type - Error type
 * @param {Object} overrides - Additional error properties
 * @returns {Error} Mock error object
 */
export function createMockError(message = 'Test error', type = 'test_error', overrides = {}) {
	const error = new Error(message);
	error.type = type;
	Object.assign(error, overrides);
	return error;
}

/**
 * Waits for a specified amount of time (for testing async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function waitFor(ms = 100) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock YouTube URL for testing
 * @param {string} videoId - YouTube video ID
 * @param {Object} params - Additional URL parameters
 * @returns {string} Mock YouTube URL
 */
export function createMockYouTubeUrl(videoId = 'dQw4w9WgXcQ', params = {}) {
	const url = new URL('https://www.youtube.com/watch');
	url.searchParams.set('v', videoId);
	
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});
	
	return url.toString();
}

/**
 * Mock environment variables for testing
 * @param {Object} envVars - Environment variables to mock
 */
export function mockEnvVars(envVars = {}) {
	const originalEnv = process.env;
	
	beforeEach(() => {
		process.env = { ...originalEnv, ...envVars };
	});
	
	afterEach(() => {
		process.env = originalEnv;
	});
}

/**
 * Creates a mock SvelteKit event object for testing
 * @param {Object} overrides - Override specific event properties
 * @returns {Object} Mock event object
 */
export function createMockEvent(overrides = {}) {
	return {
		request: new Request('http://localhost:3000', {
			method: 'GET',
			headers: new Headers()
		}),
		url: new URL('http://localhost:3000'),
		params: {},
		route: { id: null },
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(() => []),
			serialize: vi.fn()
		},
		locals: {
			user: null,
			session: null,
			supabase: createMockSupabase()
		},
		platform: null,
		clientAddress: '127.0.0.1',
		...overrides
	};
}

/**
 * Creates a mock locals object for testing server-side functions
 * @param {Object} overrides - Override specific locals properties
 * @returns {Object} Mock locals object
 */
export function createMockLocals(overrides = {}) {
	return {
		user: createMockUser(),
		session: {
			access_token: 'mock-token',
			user: createMockUser()
		},
		supabase: createMockSupabase(),
		safeGetSession: vi.fn(() => Promise.resolve({
			session: { access_token: 'mock-token' },
			user: createMockUser()
		})),
		...overrides
	};
}

/**
 * Helper to test async functions that might throw
 * @param {Function} fn - Async function to test
 * @returns {Promise<Error|null>} Error if thrown, null if successful
 */
export async function expectAsync(fn) {
	try {
		await fn();
		return null;
	} catch (error) {
		return error;
	}
}

/**
 * Mock console methods to capture logs during testing
 * @returns {Object} Object with restore function and captured logs
 */
export function mockConsole() {
	const originalConsole = { ...console };
	const logs = {
		log: [],
		error: [],
		warn: [],
		info: []
	};

	console.log = vi.fn((...args) => logs.log.push(args));
	console.error = vi.fn((...args) => logs.error.push(args));
	console.warn = vi.fn((...args) => logs.warn.push(args));
	console.info = vi.fn((...args) => logs.info.push(args));

	return {
		logs,
		restore: () => {
			Object.assign(console, originalConsole);
		}
	};
}