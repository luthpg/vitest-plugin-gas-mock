import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  name: 'vitest-plugin-gas-mock',
  outDir: 'dist',
  declaration: 'compatible',
  entries: ['src/index.ts', 'src/setup.ts'],
  clean: true,
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
  externals: ['vitest', './map.json'],
  alias: {
    '../../generated/map.json': './map.json',
  },
  hooks: {
    'build:done': (ctx) => {
      const runtimeDir = resolve(ctx.options.outDir, 'runtime');
      if (!existsSync(runtimeDir)) {
        mkdirSync(runtimeDir, { recursive: true });
      }
      const src = resolve(ctx.options.rootDir, 'generated/map.json');
      const dest = resolve(runtimeDir, 'map.json');
      copyFileSync(src, dest);
      console.log(`\n  ✔ Copied ${src} to ${dest}`);
    },
  },
});
