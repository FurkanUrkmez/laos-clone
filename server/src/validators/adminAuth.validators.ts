import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export const adminRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken gerekli'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
