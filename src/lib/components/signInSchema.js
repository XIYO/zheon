import { z } from 'zod';

export const signInSchema = z.object({
	email: z.string().email({ message: '유효한 이메일을 입력하세요.' }),
	password: z.string().min(1, { message: '비밀번호를 입력하세요.' })
});
