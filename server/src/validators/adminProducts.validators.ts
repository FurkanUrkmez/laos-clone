import { z } from 'zod';
import { imagePathSchema } from './imagePath.validators';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gerekli'),
  description: z.string().optional(),
  imageUrl: imagePathSchema.optional(),
  price: z.coerce.number().positive('Fiyat pozitif olmalı'),
  pointsReward: z.coerce.number().int().min(0, 'Puan negatif olamaz').default(1),
  categoryName: z.string().min(1, 'Kategori gerekli'),
  redeemable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
