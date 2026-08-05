// Integration test — requires a real Postgres reachable via DATABASE_URL
// (server/.env), not the in-memory/pure-function style of
// loyaltyCalc.test.ts. Bring the DB up first:
//
//   docker compose up -d      (from the repo root)
//
// then run explicitly (this file is excluded from the default `npm test`
// run — see vitest.config.ts / vitest.integration.config.ts):
//
//   npm run test:integration
//
// It creates its own isolated Business/User/LoyaltyPointTransaction rows
// and deletes the Business (which cascades to the rest) in afterAll, so
// re-runs are idempotent and it doesn't add to the dev DB's leftover data.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma';
import { redeemReward } from './adminLoyalty.service';
import { AppError } from '../utils/AppError';

const REWARD_THRESHOLD = 3;

describe('redeemReward concurrency', () => {
  let businessId: string;
  let userId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: {
        name: 'Concurrency Test Business',
        category: 'Test',
        address: 'Test Address',
        phone: '+900000000000',
        email: `concurrency-test-business-${Date.now()}@example.com`,
        workingHours: {},
        loyaltyTargetCups: REWARD_THRESHOLD,
      },
    });
    businessId = business.id;

    const user = await prisma.user.create({
      data: {
        businessId,
        fullName: 'Concurrency Test User',
        email: `concurrency-test-user-${Date.now()}@example.com`,
        passwordHash: 'not-a-real-hash',
        phone: '+900000000001',
      },
    });
    userId = user.id;

    // Enough EARN transactions to be reward-eligible exactly once
    // (balance === threshold), so a second concurrent redeem must fail.
    await prisma.loyaltyPointTransaction.createMany({
      data: Array.from({ length: REWARD_THRESHOLD }, () => ({
        userId,
        businessId,
        points: 1,
        type: 'EARN' as const,
      })),
    });
  });

  afterAll(async () => {
    // Cascades to the User and its LoyaltyPointTransactions.
    await prisma.business.delete({ where: { id: businessId } });
    await prisma.$disconnect();
  });

  it('allows exactly one of two concurrent redeems for the same balance to succeed', async () => {
    const results = await Promise.allSettled([
      redeemReward(businessId, { userId }),
      redeemReward(businessId, { userId }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const [{ value: redeemResult }] = fulfilled as PromiseFulfilledResult<
      Awaited<ReturnType<typeof redeemReward>>
    >[];
    expect(redeemResult.pointsBalance).toBe(0);

    const [{ reason }] = rejected as PromiseRejectedResult[];
    expect(reason).toBeInstanceOf(AppError);
    expect((reason as AppError).message).toBe('Puan bakiyesi ödül eşiğini karşılamıyor');

    // The double-spend guard must not have let a second REDEEM through:
    // exactly one REDEEM transaction should exist for this user.
    const redeemCount = await prisma.loyaltyPointTransaction.count({
      where: { userId, businessId, type: 'REDEEM' },
    });
    expect(redeemCount).toBe(1);
  });
});
