import { z } from 'zod';

// 이메일 스키마
const emailSchema = z
	.string()
	.min(1, '이메일을 입력해주세요')
	.email('올바른 이메일 형식이 아닙니다');

// 비밀번호 스키마
const passwordSchema = z
	.string()
	.min(1, '비밀번호를 입력해주세요')
	.min(8, '비밀번호는 최소 8자 이상이어야 합니다');

// 로그인 스키마
export const signInSchema = z.object({
	email: emailSchema,
	password: passwordSchema
});

// 회원가입 스키마
export const signUpSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요')
}).refine(data => data.password === data.confirmPassword, {
	message: '비밀번호가 일치하지 않습니다',
	path: ['confirmPassword']
});