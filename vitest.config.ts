import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts'
      ],
      reporter: ['text-summary', 'json-summary', 'lcov'],
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
