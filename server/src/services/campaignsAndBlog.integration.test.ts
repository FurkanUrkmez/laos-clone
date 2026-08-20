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
    const { items, hasMore } = await listActiveCampaigns(businessId, { page: 1, limit: 10 });
    expect(items.map((c) => c.title)).toEqual(['Active Campaign']);
    expect(hasMore).toBe(false);
  });

  it('only returns published blog posts', async () => {
    const { items, hasMore } = await listPublishedBlogPosts(businessId, { page: 1, limit: 10 });
    expect(items.map((p) => p.title)).toEqual(['Published Post']);
    expect(hasMore).toBe(false);
  });

  it('paginates blog posts and returns an excerpt instead of full content', async () => {
    const longContent = 'x'.repeat(200);
    await prisma.blogPost.createMany({
      data: [
        { businessId, title: 'Long Post', slug: 'long-post', content: longContent, isPublished: true, publishedAt: new Date() },
        { businessId, title: 'Second Post', slug: 'second-post', content: 'short', isPublished: true, publishedAt: new Date() },
      ],
    });

    const page1 = await listPublishedBlogPosts(businessId, { page: 1, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.items.every((p) => !('content' in p))).toBe(true);
    const longPost = page1.items.find((p) => p.title === 'Long Post');
    expect(longPost?.excerpt.length).toBeLessThan(longContent.length);
    expect(longPost?.excerpt.endsWith('…')).toBe(true);

    const page2 = await listPublishedBlogPosts(businessId, { page: 2, limit: 2 });
    expect(page2.hasMore).toBe(false);
    expect(page2.items).toHaveLength(1);
  });
});
