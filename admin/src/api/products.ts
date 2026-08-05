import type { Product } from '../types';
import { apiClient } from './client';

export async function listProductsRequest(): Promise<Product[]> {
  const { data } = await apiClient.get<{ products: Product[] }>('/admin/products');
  return data.products;
}
