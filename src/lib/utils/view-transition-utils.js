/**
	* CSS view-transition-name은 custom-ident 규칙을 따르므로
	* uuid처럼 숫자/특수문자가 섞여 있을 때를 대비해 정규화한다.
	* @param {string} prefix
	* @param {string | number | null | undefined} value
	*/
export const viewTransitionName = (prefix, value) => {
	const normalized = String(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, '-')
		.replace(/^-+/, '');

	const suffix = normalized.length > 0 ? normalized : 'fallback';
	return `${prefix}-${suffix}`;
};

/**
	* 요약 썸네일 간 뷰 트랜지션 이름 헬퍼
	* @param {string | number} id
	*/
export const summaryThumbTransition = (id) => viewTransitionName('summary-thumb', id);
