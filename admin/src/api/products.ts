import type { Product } from '../types';
import { apiClient } from './client';

export interface ProductInput {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  pointsReward: number;
  categoryName: string;
  redeemable?: boolean;
  isActive?: boolean;
}

export async function listProductsRequest(): Promise<Product[]> {
  const { data } = await apiClient.get<{ products: Product[] }>('/admin/products');
  return data.products;
}

export async function createProductRequest(input: ProductInput): Promise<Product> {
  const { data } = await apiClient.post<{ product: Product }>('/admin/products', input);
  return data.product;
}

export async function updateProductRequest(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data } = await apiClient.patch<{ product: Product }>(`/admin/products/${id}`, input);
  return data.product;
}

export async function deleteProductRequest(id: string): Promise<void> {
  await apiClient.delete(`/admin/products/${id}`);
}
