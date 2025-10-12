import * as v from 'valibot';

// 이메일 스키마
const emailSchema = v.pipe(
	v.string('이메일을 입력해주세요'),
	v.minLength(1, '이메일을 입력해주세요'),
	v.email('올바른 이메일 형식이 아닙니다')
);

// 비밀번호 스키마
const passwordSchema = v.pipe(
	v.string('비밀번호를 입력해주세요'),
	v.minLength(1, '비밀번호를 입력해주세요'),
	v.minLength(8, '비밀번호는 최소 8자 이상이어야 합니다')
);

// 로그인 스키마
export const signInSchema = v.object({
	email: emailSchema,
	password: passwordSchema
});

// 회원가입 스키마
export const signUpSchema = v.pipe(
	v.object({
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: v.pipe(
			v.string('비밀번호 확인을 입력해주세요'),
			v.minLength(1, '비밀번호 확인을 입력해주세요')
		)
	}),
	v.forward(
		v.partialCheck(
			[['password'], ['confirmPassword']],
			(input) => input.password === input.confirmPassword,
			'비밀번호가 일치하지 않습니다'
		),
		['confirmPassword']
	)
);
