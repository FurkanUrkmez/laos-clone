import { z } from 'zod';

// Accepts either an absolute URL or a path returned by our own upload
// endpoint (e.g. "/uploads/xxx.jpg"). Uploaded images are stored as
// relative paths so each client (admin panel, mobile app) can resolve
// them against its own API host instead of whichever host happened to
// perform the upload.
export const imagePathSchema = z
  .string()
  .refine((value) => value.startsWith('/') || z.string().url().safeParse(value).success, {
    message: 'Geçerli bir URL veya yol girin',
  });
