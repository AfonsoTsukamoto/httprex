import { resolve } from 'path';

export const root = resolve(__dirname, 'src');
export const pagesDir = resolve(root, 'pages');
export const componentsDir = resolve(root, 'components');
export const assetsDir = resolve(root, 'assets');
export const outDir = resolve(__dirname, 'dist');
export const publicDir = resolve(__dirname, 'public');

export const alias = {
  '@src': root,
  '@assets': assetsDir,
  '@pages': pagesDir,
  '@components': componentsDir
};

export const sharedConfig = {
  resolve: { alias }
};

