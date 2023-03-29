import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path';
import { root, pagesDir, assetsDir, outDir, publicDir, sharedConfig } from './vite.shared';

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,
  plugins: [react()],
  publicDir,
  build: {
    outDir,
    sourcemap: process.env.__DEV__ === 'true',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        //devtools: resolve(pagesDir, 'devtools', 'index.html'),
        //panel: resolve(pagesDir, 'panel', 'index.html'),
        content: resolve(pagesDir, 'content', 'index.tsx'),
        background: resolve(pagesDir, 'background', 'index.ts'),
        //popup: resolve(pagesDir, 'popup', 'index.html'),
        //newtab: resolve(pagesDir, 'newtab', 'index.html'),
        //options: resolve(pagesDir, 'options', 'index.html'),
      },
      output: {
        entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`,
      },
    },
  },
});
