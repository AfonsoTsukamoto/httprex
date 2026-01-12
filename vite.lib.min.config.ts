/**
 * Vite configuration for minified library build
 * Generates production-ready minified bundles for CDN usage
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib-httprex/index.ts'),
      formats: ['es', 'iife'],
      fileName: (format) => {
        if (format === 'es') {
          return 'httprex.min.mjs';
        }
        return 'httprex.min.js';
      },
      name: 'Httprex'
    },
    outDir: 'dist/lib',
    emptyOutDir: false, // Don't clear - append to existing builds
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
