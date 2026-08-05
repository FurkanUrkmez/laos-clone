import { z } from 'zod';

export const createBlogPostSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalı'),
  content: z.string().min(1, 'İçerik gerekli'),
  coverImageUrl: z.string().url('Geçerli bir URL girin').optional(),
  isPublished: z.boolean().optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
