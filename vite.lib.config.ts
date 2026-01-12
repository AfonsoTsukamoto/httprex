/**
 * Vite configuration for library build
 * Generates distributable formats for npm, CDN, and third-party integration
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
          return 'httprex.mjs';
        }
        // IIFE format for <script> tags
        return 'httprex.js';
      },
      name: 'Httprex' // Global variable name for IIFE
    },
    outDir: 'dist/lib',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: 'named',
        preserveModules: false,
        banner: (chunk) => {
          if (chunk.fileName.endsWith('.js')) {
            return `/* Httprex - HTTP Request Library for Markdown */`;
          }
          return '';
        }
      }
    },
    minify: false // We'll create minified versions separately
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
