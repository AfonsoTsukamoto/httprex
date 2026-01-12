/**
 * Vite configuration for web-components build
 * Generates web components bundle separately
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/web-components/index.ts'),
      formats: ['es'],
      fileName: () => 'web-components.mjs',
      name: 'HttprexWebComponents'
    },
    outDir: 'dist/lib',
    emptyOutDir: false, // Don't clear - append to existing builds
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: 'named',
        preserveModules: false,
        banner: () => '/* Httprex Web Components */'
      }
    },
    minify: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
