import { defineConfig } from 'vite'
import { resolve } from 'path';
import { root, assetsDir, outDir, publicDir, sharedConfig } from './vite.shared';

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,
  plugins: [],
  publicDir,
  build: {
    outDir,
    sourcemap: process.env.__DEV__ === 'true',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demo: resolve(__dirname, 'demo.html'),
        // Chrome extension files
        'chrome-extension-content': resolve(__dirname, 'src/chrome-extension/content.ts'),
        'chrome-extension-background': resolve(__dirname, 'src/chrome-extension/background.ts'),
        'chrome-extension-popup': resolve(__dirname, 'src/chrome-extension/popup.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          // Chrome extension files go to dist/chrome-extension/
          if (chunk.name === 'chrome-extension-content') {
            return 'chrome-extension/content.js';
          }
          if (chunk.name === 'chrome-extension-background') {
            return 'chrome-extension/background.js';
          }
          if (chunk.name === 'chrome-extension-popup') {
            return 'chrome-extension/popup.js';
          }
          // Default output path
          return `assets/${chunk.name}.js`;
        },
      },
    },
  },
});
