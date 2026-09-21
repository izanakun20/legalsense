import { defineConfig } from 'vitest/config';
import * as path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load .env.local for GEMINI_API_KEY
  const env = loadEnv(mode || 'test', process.cwd(), '');
  return {
    resolve: {
      alias: {
        'server-only': path.resolve(__dirname, './src/test/__mocks__/server-only.ts'),
      }
    },
    test: {
      include: ['evals/**/*.eval.ts'],
      exclude: ['src/**', 'node_modules/**'],
      // Long timeout for live API calls
      testTimeout: 600_000, // 10 minutes
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      env: {
        ...env,
      },
    }
  };
});
