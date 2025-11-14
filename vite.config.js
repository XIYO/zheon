import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit()],
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
