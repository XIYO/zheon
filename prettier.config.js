export default {
	plugins: ['prettier-plugin-astro'],

	printWidth: 9999, // 실제 한계값
	singleAttributePerLine: false, // 태그 속성 한 줄로
	objectWrap: 'collapse', // 객체/배열 한 줄 가능하면 한 줄
	htmlWhitespaceSensitivity: 'ignore',
	proseWrap: 'never', // 마크다운도 한 줄
	bracketSameLine: true // 닫는 `>` 같은 줄
};
