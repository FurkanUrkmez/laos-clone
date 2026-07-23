import { z } from 'zod';

const turkishPhoneRegex = /^(\+90|0)?5\d{9}$/;

export const registerFormSchema = z.object({
  fullName: z.string().min(3, 'Ad Soyad en az 3 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli'),
  phone: z.string().regex(turkishPhoneRegex, 'Geçerli bir telefon numarası girin (05XXXXXXXXX)'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']),
});

export const loginFormSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
