import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
	plugins: [
		enhancedImages(), // must come before the SvelteKit plugin
		sveltekit(),
	],
	server: {
  		watch: { usePolling: true },
  		host: "0.0.0.0",
  		port: 5173
	}
});
