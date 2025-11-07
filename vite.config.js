import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 7777,
		strictPort: true
	},
	preview: {
		port: 17777,
		strictPort: true
	},
	build: {
		rollupOptions: {
			external: ['cloudflare:workers']
		}
	},
	ssr: {
		external: ['cloudflare:workers'],
		noExternal: []
	}
});
