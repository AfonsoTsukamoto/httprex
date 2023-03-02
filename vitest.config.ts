import { defineConfig } from 'vitest/config'
import { sharedConfig } from './vite.shared';

export default defineConfig({
  ...sharedConfig,
  test: {
    globals: true
  }
})
