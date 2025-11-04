import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	server: {
		port: 7777,
		strictPort: true,
		watch: {
			ignored: ['**/src/lib/paraglide/**']
		}
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
