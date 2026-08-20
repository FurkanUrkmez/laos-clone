const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// API_URL includes the `/api` suffix; uploaded assets are served from the
// same host but outside that prefix.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Resolves an image path/URL from the API against this client's own API
// host. Handles both the relative paths the upload endpoint returns
// ("/uploads/xxx.jpg") and any previously-stored absolute URLs (which may
// carry a different host than this client uses, e.g. one baked in by the
// admin panel) by keeping only the path.
export function resolveAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const path = new URL(value, API_ORIGIN).pathname;
    return `${API_ORIGIN}${path}`;
  } catch {
    return value;
  }
}
