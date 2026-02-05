import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function mockGas(): Plugin {
  const setupFilePath = resolve(__dirname, 'setup');

  return {
    name: 'vite-plugin-gasmock',
    config: (config) => {
      const setupFiles = config.test?.setupFiles || [];
      const newSetupFiles = Array.isArray(setupFiles)
        ? [...setupFiles, setupFilePath]
        : [setupFiles, setupFilePath];

      return {
        test: {
          setupFiles: newSetupFiles,
        },
      };
    },
  };
}
