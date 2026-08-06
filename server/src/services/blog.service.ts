import { prisma } from '../lib/prisma';

export async function listPublishedBlogPosts(businessId: string) {
  return prisma.blogPost.findMany({
    where: { businessId, isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });
}
