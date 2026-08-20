import { z } from 'zod';

const LOYALTY_CODE_PATTERN = /^\d{6}$/;

export const scanSchema = z
  .object({
    qrValue: z.string().min(1).optional(),
    loyaltyCode: z.string().regex(LOYALTY_CODE_PATTERN, 'Kod 6 haneli olmalı').optional(),
    productId: z.string().min(1, 'Geçerli bir ürün seçin'),
  })
  .refine((data) => Boolean(data.qrValue) !== Boolean(data.loyaltyCode), {
    message: 'qrValue veya loyaltyCode alanlarından tam olarak biri gerekli',
    path: ['qrValue'],
  });

export const redeemSchema = z.object({
  userId: z.string().uuid('Geçerli bir kullanıcı seçin'),
  productId: z.string().min(1).optional(),
});

export type ScanInput = z.infer<typeof scanSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
