import { defineConfig } from 'vitest/config';
import { mockGas } from './src/plugin';

export default defineConfig({
  plugins: [mockGas()],
  test: {
    globals: true,
  },
});
