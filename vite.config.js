import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString())
	},
	server: {
		port: 7777,
		strictPort: true
	},
	preview: {
		port: 17777,
		strictPort: true
	},
	ssr: {
		noExternal: mode === 'production' ? true : undefined,
		external: mode === 'production' ? ['socks-proxy-agent'] : undefined
	}
}));
