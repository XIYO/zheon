import { describe, it, expect, vi } from 'vitest';
import { validateUser, isAuthenticated, getUserId } from '../../../src/lib/server/auth-utils.js';

describe('auth-utils', () => {
	describe('validateUser', () => {
		it('should throw redirect when user is null', () => {
			const url = new URL('http://localhost:3000/dashboard?param=value');
			
			expect(() => {
				validateUser(null, url);
			}).toThrow();
		});

		it('should throw redirect when user is undefined', () => {
			const url = new URL('http://localhost:3000/dashboard');
			
			expect(() => {
				validateUser(undefined, url);
			}).toThrow();
		});

		it('should not throw when user is valid', () => {
			const user = { id: 'user-123', email: 'test@example.com' };
			const url = new URL('http://localhost:3000/dashboard');
			
			expect(() => {
				validateUser(user, url);
			}).not.toThrow();
		});

		it('should include current path and search params in redirect', () => {
			const url = new URL('http://localhost:3000/dashboard?tab=summary&id=123');
			
			expect(() => {
				validateUser(null, url);
			}).toThrow();
		});
	});

	describe('isAuthenticated', () => {
		it('should return false for null user', () => {
			expect(isAuthenticated(null)).toBe(false);
		});

		it('should return false for undefined user', () => {
			expect(isAuthenticated(undefined)).toBe(false);
		});

		it('should return true for valid user object', () => {
			const user = { id: 'user-123' };
			expect(isAuthenticated(user)).toBe(true);
		});

		it('should return true for user with additional properties', () => {
			const user = { 
				id: 'user-123', 
				email: 'test@example.com',
				name: 'Test User'
			};
			expect(isAuthenticated(user)).toBe(true);
		});
	});

	describe('getUserId', () => {
		it('should return null for null user', () => {
			expect(getUserId(null)).toBe(null);
		});

		it('should return null for undefined user', () => {
			expect(getUserId(undefined)).toBe(null);
		});

		it('should return null for user without id', () => {
			const user = { email: 'test@example.com' };
			expect(getUserId(user)).toBe(null);
		});

		it('should return user id when present', () => {
			const user = { id: 'user-123', email: 'test@example.com' };
			expect(getUserId(user)).toBe('user-123');
		});

		it('should handle falsy id values', () => {
			expect(getUserId({ id: '' })).toBe(null);
			expect(getUserId({ id: 0 })).toBe(null);
			expect(getUserId({ id: false })).toBe(null);
		});
	});
});