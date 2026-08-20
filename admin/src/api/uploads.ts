import { apiClient } from './client';

export async function uploadImageRequest(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post<{ url: string }>('/admin/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
