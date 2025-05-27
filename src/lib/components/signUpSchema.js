import { z } from 'zod';

export const signUpSchema = z.object({
	email: z.string().email({ message: '유효한 이메일을 입력하세요.' }),
	name: z.string().min(2, { message: '이름을 입력하세요.' }),
	password: z.string().min(6, { message: '비밀번호는 6자 이상이어야 합니다.' }),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: '비밀번호가 일치하지 않습니다.',
	path: ['confirmPassword']
});
