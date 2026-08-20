import { prisma } from '../lib/prisma';
import type { PaginationQuery } from '../validators/pagination.validators';

const EXCERPT_LENGTH = 160;

function toExcerpt(content: string): string {
  return content.length > EXCERPT_LENGTH ? `${content.slice(0, EXCERPT_LENGTH).trimEnd()}…` : content;
}

export async function listPublishedBlogPosts(businessId: string, { page, limit }: PaginationQuery) {
  // Fetch one extra row to know whether another page exists, without a
  // separate COUNT query.
  const rows = await prisma.blogPost.findMany({
    where: { businessId, isPublished: true },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  // The list view only ever shows a short excerpt, so the full `content`
  // (which can be arbitrarily long) is never sent over the wire here.
  const items = rows.slice(0, limit).map(({ content, ...rest }) => ({
    ...rest,
    excerpt: toExcerpt(content),
  }));
  return { items, hasMore };
}
