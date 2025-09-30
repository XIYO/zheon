import { describe, expect, it, vi } from 'vitest';

vi.mock('lucia', () => ({
	LuciaError: class MockLuciaError extends Error {
		constructor(message) {
			super(message);
			this.name = 'LuciaError';
		}
	}
}));

const { actions } = await import('../../../src/routes/(non-header)/auth/sign-up/+page.server.js');

const createRequest = (formEntries) => {
	const formData = new FormData();
	for (const [key, value] of Object.entries(formEntries)) {
		formData.set(key, value);
	}

	return new Request('https://example.com/auth/sign-up', {
		method: 'POST',
		body: formData
	});
};

describe('회원가입 액션', () => {
	const baseUrl = new URL('https://example.com/auth/sign-up');

	it('올바른 입력값으로 회원가입 후 세션을 설정하고 완료 페이지로 리다이렉트한다', async () => {
		const locals = {
			lucia: {
				createUser: vi.fn().mockResolvedValue({ userId: 'user_1' }),
				createSession: vi.fn().mockResolvedValue({ sessionId: 'session_1' })
			},
			auth: {
				setSession: vi.fn()
			}
		};

		const request = createRequest({
			email: 'test@example.com',
			password: 'password123',
			'password-confirm': 'password123'
		});

		try {
			await actions.email({ locals, request, url: baseUrl });
			throw new Error('redirect가 발생해야 합니다.');
		} catch (error) {
			expect(error?.status).toBe(303);
			expect(error?.location).toBe('/auth/sign-up/done');
		}

		expect(locals.lucia.createUser).toHaveBeenCalledWith({
			key: {
				providerId: 'email',
				providerUserId: 'test@example.com',
				password: 'password123'
			},
			attributes: {
				email: 'test@example.com',
				email_verified: 0,
				display_name: null,
				picture_url: null,
				locale: null
			}
		});
		expect(locals.lucia.createSession).toHaveBeenCalledWith({
			userId: 'user_1',
			attributes: {}
		});
		expect(locals.auth.setSession).toHaveBeenCalledWith({ sessionId: 'session_1' });
	});

	it('중복된 이메일로 회원가입 시 400 상태와 오류 메시지를 반환한다', async () => {
		const MockLuciaError = (await import('lucia')).LuciaError;
		const locals = {
			lucia: {
				createUser: vi.fn().mockRejectedValue(new MockLuciaError('AUTH_DUPLICATE_KEY_ID')),
				createSession: vi.fn()
			},
			auth: {
				setSession: vi.fn()
			}
		};

		const request = createRequest({
			email: 'duplicate@example.com',
			password: 'password123',
			'password-confirm': 'password123'
		});

		const result = await actions.email({ locals, request, url: baseUrl });

		expect(result?.status).toBe(400);
		expect(result?.data?.message).toBe('이미 가입된 이메일입니다.');
		expect(locals.lucia.createSession).not.toHaveBeenCalled();
		expect(locals.auth.setSession).not.toHaveBeenCalled();
	});

	it('비밀번호 확인이 일치하지 않으면 검증 오류를 반환한다', async () => {
		const locals = {
			lucia: {
				createUser: vi.fn(),
				createSession: vi.fn()
			},
			auth: {
				setSession: vi.fn()
			}
		};

		const request = createRequest({
			email: 'user@example.com',
			password: 'password123',
			'password-confirm': 'different123'
		});

		const result = await actions.email({ locals, request, url: baseUrl });

		expect(result?.status).toBe(400);
		expect(result?.data?.message).toBe('비밀번호가 일치하지 않습니다');
		expect(result?.data?.errors?.confirmPassword).toContain('비밀번호가 일치하지 않습니다');
		expect(locals.lucia.createUser).not.toHaveBeenCalled();
	});
});
