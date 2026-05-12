import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [svelte()],
  resolve: {
    alias: {
      buffer: 'buffer/'
    }
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/bpmn-js') || id.includes('node_modules/dmn-js') || id.includes('node_modules/@bpmn-io')) {
            return 'vendor-bpmn';
          }
          if (id.includes('node_modules/chart.js')) {
            return 'vendor-chart';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  assetsInclude: ['**/*.bpmn'],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    coverage: {
      provider: 'v8'
    },
    include: ['src/lib/engines/*.test.js', 'src/__tests__/*.test.js']
  }
});
