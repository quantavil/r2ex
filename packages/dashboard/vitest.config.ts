import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: resolve(__dirname, 'src/lib')
    }
  },
  test: {
    environment: 'happy-dom',
    exclude: ['e2e/**', 'node_modules/**']
  }
});
