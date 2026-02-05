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
});
