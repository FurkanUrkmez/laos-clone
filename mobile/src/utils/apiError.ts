import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Bir şeyler ters gitti, tekrar deneyin'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) {
      return data.error;
    }
    if (error.message === 'Network Error') {
      return 'Sunucuya ulaşılamıyor. Aynı Wi-Fi ağında olduğunuzdan ve sunucunun çalıştığından emin olun.';
    }
  }
  return fallback;
}
