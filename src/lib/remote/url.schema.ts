import * as v from 'valibot';

const isValidUrl = (str: string) => {
	try {
		const url = new URL(str);
		return url.protocol === 'https:';
	} catch {
		if (!str.startsWith('http://') && !str.startsWith('https://')) {
			try {
				new URL(`https://${str}`);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	}
};

export const urlSchema = v.pipe(
	v.string('URL을 입력해주세요'),
	v.transform((input) => input.trim()),
	v.minLength(1, 'URL을 입력해주세요'),
	v.check(isValidUrl, '지원하지 않는 URL 입니다')
);
