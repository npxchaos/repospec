import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Injected by tsup at build time; provided here so unit tests can load the CLI.
  define: {
    __CLI_VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
    },
  },
});
