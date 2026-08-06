import { defineConfig } from 'vitest/config';

// Config for DB-backed integration tests only. These need a real Postgres
// reachable via DATABASE_URL (see server/.env / docker-compose.yml at the
// repo root: `docker compose up -d`) and are intentionally excluded from
// the default `npm test` run (see vitest.config.ts). Run with:
//   npm run test:integration
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.concurrency.test.ts', '**/*.integration.test.ts'],
  },
});
