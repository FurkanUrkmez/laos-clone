// Integration test — requires a real Postgres reachable via DATABASE_URL
// (server/.env). Bring the DB up first:
//
//   docker compose up -d      (from the repo root)
//
// then run explicitly (this file is excluded from the default `npm test`
// run — see vitest.config.ts / vitest.integration.config.ts):
//
//   npm run test:integration
//
// It creates its own isolated Business/User/Category/Product rows and
// deletes the Business (which cascades to the rest) in afterAll, so
// re-runs are idempotent.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma';
import { redeemReward, scanProduct } from './adminLoyalty.service';
import { generateUniqueLoyaltyCode } from '../utils/loyaltyCode';
import { AppError } from '../utils/AppError';

const REWARD_THRESHOLD = 1;

describe('loyalty code lookup and redeemable enforcement', () => {
  let businessId: string;
  let userId: string;
  let userLoyaltyCode: string;
  let categoryId: string;
  let redeemableProductId: string;
  let nonRedeemableProductId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: {
        name: 'Loyalty Code Test Business',
        category: 'Test',
        address: 'Test Address',
        phone: '+900000000000',
        email: `loyalty-code-test-business-${Date.now()}@example.com`,
        workingHours: {},
        loyaltyTargetCups: REWARD_THRESHOLD,
      },
    });
    businessId = business.id;

    const category = await prisma.category.create({
      data: { businessId, name: 'Test Category' },
    });
    categoryId = category.id;

    const redeemableProduct = await prisma.product.create({
      data: {
        businessId,
        categoryId,
        name: 'Redeemable Product',
        price: 10,
        pointsReward: 1,
        redeemable: true,
      },
    });
    redeemableProductId = redeemableProduct.id;

    const nonRedeemableProduct = await prisma.product.create({
      data: {
        businessId,
        categoryId,
        name: 'Non-Redeemable Product',
        price: 10,
        pointsReward: 1,
        redeemable: false,
      },
    });
    nonRedeemableProductId = nonRedeemableProduct.id;

    userLoyaltyCode = await generateUniqueLoyaltyCode();
    const user = await prisma.user.create({
      data: {
        businessId,
        fullName: 'Loyalty Code Test User',
        email: `loyalty-code-test-user-${Date.now()}@example.com`,
        passwordHash: 'not-a-real-hash',
        phone: '+900000000001',
        loyaltyCode: userLoyaltyCode,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Cascades to the User, Products, Category and their transactions.
    await prisma.business.delete({ where: { id: businessId } });
    await prisma.$disconnect();
  });

  it('generates distinct codes across calls', async () => {
    const codeA = await generateUniqueLoyaltyCode();
    const codeB = await generateUniqueLoyaltyCode();
    expect(codeA).not.toBe(codeB);
    expect(codeA).toMatch(/^\d{6}$/);
  });

  it('resolves the user via loyaltyCode and adds points', async () => {
    const result = await scanProduct(businessId, {
      loyaltyCode: userLoyaltyCode,
      productId: redeemableProductId,
    });
    expect(result.userId).toBe(userId);
    expect(result.pointsBalance).toBe(1);
    expect(result.rewardEligible).toBe(true);
  });

  it('rejects an unknown loyaltyCode', async () => {
    await expect(
      scanProduct(businessId, { loyaltyCode: '000000', productId: redeemableProductId }),
    ).rejects.toThrow('Bu koda kayıtlı müşteri bulunamadı');
  });

  it('rejects redeeming a non-redeemable product', async () => {
    await expect(
      redeemReward(businessId, { userId, productId: nonRedeemableProductId }),
    ).rejects.toThrow(AppError);
  });

  it('redeems a redeemable product and links it on the transaction', async () => {
    const result = await redeemReward(businessId, { userId, productId: redeemableProductId });
    expect(result.pointsBalance).toBe(0);

    const transaction = await prisma.loyaltyPointTransaction.findFirst({
      where: { userId, businessId, type: 'REDEEM' },
      orderBy: { createdAt: 'desc' },
    });
    expect(transaction?.productId).toBe(redeemableProductId);
    expect(transaction?.note).toContain('Redeemable Product');
  });
});
