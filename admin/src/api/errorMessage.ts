import { AxiosError } from 'axios';

/**
 * Extracts a human-readable message from an API error.
 *
 * The backend's error handler (see server/src/middleware/errorHandler.ts)
 * responds with `{ error: string }` for both known `AppError`s and Zod
 * validation failures, so that's the field we look for. Falls back to a
 * caller-supplied message for network errors, unexpected shapes, etc.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const serverMessage = error.response?.data?.error;
    if (typeof serverMessage === 'string') return serverMessage;
  }
  return fallback;
}
