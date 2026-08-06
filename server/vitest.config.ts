import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Integration tests that need a real database (Docker Postgres via
    // DATABASE_URL) are excluded from the default fast unit-test run.
    // Run them explicitly with `npm run test:integration`.
    exclude: [
      ...configDefaults.exclude,
      '**/*.concurrency.test.ts',
      '**/*.integration.test.ts',
    ],
  },
});
