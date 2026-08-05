import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { CreateBlogPostInput, UpdateBlogPostInput } from '../validators/adminBlogPosts.validators';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

async function generateUniqueSlug(businessId: string, title: string): Promise<string> {
  const base = slugify(title) || 'yazi';
  let slug = base;
  let counter = 2;
  while (await prisma.blogPost.findUnique({ where: { businessId_slug: { businessId, slug } } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function listBlogPosts(businessId: string) {
  return prisma.blogPost.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function createBlogPost(businessId: string, input: CreateBlogPostInput) {
  const slug = await generateUniqueSlug(businessId, input.title);
  const isPublished = input.isPublished ?? false;
  return prisma.blogPost.create({
    data: {
      businessId,
      title: input.title,
      slug,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });
}

async function requireOwnedBlogPost(businessId: string, postId: string) {
  const post = await prisma.blogPost.findFirst({ where: { id: postId, businessId } });
  if (!post) {
    throw new AppError(404, 'Blog yazısı bulunamadı');
  }
  return post;
}

export async function updateBlogPost(businessId: string, postId: string, input: UpdateBlogPostInput) {
  const existing = await requireOwnedBlogPost(businessId, postId);
  const willPublishNow = input.isPublished === true && !existing.isPublished;
  return prisma.blogPost.update({
    where: { id: postId },
    data: {
      ...input,
      publishedAt: willPublishNow ? new Date() : undefined,
    },
  });
}

export async function deleteBlogPost(businessId: string, postId: string) {
  await requireOwnedBlogPost(businessId, postId);
  await prisma.blogPost.delete({ where: { id: postId } });
}
