import { z } from 'zod';

const turkishPhoneRegex = /^(\+90|0)?5\d{9}$/;

export const registerSchema = z.object({
  fullName: z.string().min(3, 'Ad Soyad en az 3 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli'),
  phone: z.string().regex(turkishPhoneRegex, 'Geçerli bir telefon numarası girin'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken gerekli'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
