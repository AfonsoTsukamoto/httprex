import { resolve } from 'path';

export const root = resolve(__dirname, 'src');
export const assetsDir = resolve(root, 'assets');
export const outDir = resolve(__dirname, 'dist');
export const publicDir = resolve(__dirname, 'public');

// Deprecated paths (kept for reference, point to deprecated locations)
export const pagesDir = resolve(root, 'lib-deprecated/pages-old');
export const componentsDir = resolve(root, 'lib-deprecated/components-old');

export const alias = {
  '@src': root,
  '@assets': assetsDir,
  '@pages': pagesDir,
  '@components': componentsDir
};

export const sharedConfig = {
  resolve: { alias }
};

