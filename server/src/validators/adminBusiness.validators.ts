import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'İşletme adı gerekli').optional(),
  category: z.string().min(1, 'Kategori gerekli').optional(),
  address: z.string().min(1, 'Adres gerekli').optional(),
  phone: z.string().min(1, 'Telefon gerekli').optional(),
  email: z.string().email('Geçerli bir e-posta adresi girin').optional(),
  logoUrl: z.string().url('Geçerli bir URL girin').nullable().optional(),
  workingHours: z.record(z.string(), z.string()).optional(),
  loyaltyTargetCups: z.number().int().positive('Eşik en az 1 olmalı').optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
