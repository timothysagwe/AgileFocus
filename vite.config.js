import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [svelte()],
  base: basePath,
  test: {
    environment: 'node'
  }
});
