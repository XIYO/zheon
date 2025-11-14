import { createConsola } from 'consola';
import { browser, dev } from '$app/environment';

function getLogLevel() {
	if (browser && !dev) return 2;
	if (!browser && !dev) return 5;
	return 8;
}

export const logger = createConsola({
	level: getLogLevel()
});
