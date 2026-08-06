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
import { getMyLoyalty } from './loyalty.service';

const REWARD_THRESHOLD = 7;

describe('getMyLoyalty', () => {
  let businessId: string;
  let userId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: {
        name: 'Loyalty Test Business',
        category: 'Test',
        address: 'Test Address',
        phone: '+900000000000',
        email: `loyalty-test-business-${Date.now()}@example.com`,
        workingHours: {},
        loyaltyTargetCups: REWARD_THRESHOLD,
      },
    });
    businessId = business.id;

    const user = await prisma.user.create({
      data: {
        businessId,
        fullName: 'Loyalty Test User',
        email: `loyalty-test-user-${Date.now()}@example.com`,
        passwordHash: 'not-a-real-hash',
        phone: '+900000000001',
      },
    });
    userId = user.id;

    // Below the threshold: 5 EARN transactions against a threshold of 7.
    await prisma.loyaltyPointTransaction.createMany({
      data: Array.from({ length: 5 }, () => ({
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

  it('reports the business threshold and current balance when below it', async () => {
    const result = await getMyLoyalty(businessId, userId);
    expect(result).toEqual({
      pointsBalance: 5,
      threshold: REWARD_THRESHOLD,
      rewardEligible: false,
    });
  });

  it('reflects an updated threshold and reward eligibility once the balance meets it', async () => {
    // Two more EARN transactions bring the balance to 7 (== threshold).
    await prisma.loyaltyPointTransaction.createMany({
      data: Array.from({ length: 2 }, () => ({
        userId,
        businessId,
        points: 1,
        type: 'EARN' as const,
      })),
    });

    const result = await getMyLoyalty(businessId, userId);
    expect(result).toEqual({
      pointsBalance: 7,
      threshold: REWARD_THRESHOLD,
      rewardEligible: true,
    });
  });
});
