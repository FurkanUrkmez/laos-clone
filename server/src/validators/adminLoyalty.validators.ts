import { z } from 'zod';

export const scanSchema = z.object({
  qrValue: z.string().min(1, 'qrValue gerekli'),
  productId: z.string().uuid('Geçerli bir ürün seçin'),
});

export const redeemSchema = z.object({
  userId: z.string().uuid('Geçerli bir kullanıcı seçin'),
});

export type ScanInput = z.infer<typeof scanSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
