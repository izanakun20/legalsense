import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './src/test/__mocks__/server-only.ts'),
    }
  },
  test: {
    setupFiles: ['./src/test/setup.ts'],
    // @ts-expect-error Missing property in v5 types
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/*.test.ts', 'node'],
    ],
    exclude: ['node_modules/**', 'evals/**/*.eval.ts'],

    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts'
      ],
      reporter: ['text', 'text-summary', 'json-summary', 'lcov'],
      thresholds: {
        statements: 10,
        branches: 12,
        functions: 7,
        lines: 11
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
