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
// It creates its own isolated Business and deletes it (cascading to
// campaigns/blog posts) in afterAll, so re-runs are idempotent.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma';
import { listActiveCampaigns } from './campaigns.service';
import { listPublishedBlogPosts } from './blog.service';

describe('customer-facing campaigns and blog listings', () => {
  let businessId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: {
        name: 'Campaigns/Blog Test Business',
        category: 'Test',
        address: 'Test Address',
        phone: '+900000000000',
        email: `campaigns-blog-test-${Date.now()}@example.com`,
        workingHours: {},
      },
    });
    businessId = business.id;

    await prisma.campaign.createMany({
      data: [
        {
          businessId,
          title: 'Active Campaign',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          isActive: true,
        },
        {
          businessId,
          title: 'Inactive Campaign',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          isActive: false,
        },
      ],
    });

    await prisma.blogPost.createMany({
      data: [
        {
          businessId,
          title: 'Published Post',
          slug: 'published-post',
          content: 'This post is published.',
          isPublished: true,
          publishedAt: new Date(),
        },
        {
          businessId,
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'This post is a draft.',
          isPublished: false,
        },
      ],
    });
  });

  afterAll(async () => {
    // Cascades to campaigns and blog posts.
    await prisma.business.delete({ where: { id: businessId } });
    await prisma.$disconnect();
  });

  it('only returns active campaigns', async () => {
    const campaigns = await listActiveCampaigns(businessId);
    expect(campaigns.map((c) => c.title)).toEqual(['Active Campaign']);
  });

  it('only returns published blog posts', async () => {
    const posts = await listPublishedBlogPosts(businessId);
    expect(posts.map((p) => p.title)).toEqual(['Published Post']);
  });
});
