import { createConsola } from 'consola';
import { browser, dev } from '$app/environment';

/**
 * 환경별 로그 레벨을 반환
 * @returns {number} consola 로그 레벨
 */
function getLogLevel() {
	if (browser && !dev) return 2;
	if (!browser && !dev) return 5;
	return 8;
}

export const logger = createConsola({
	level: getLogLevel()
});
