import { apiClient } from './client';

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsReward: number;
  price: string;
  redeemable: boolean;
}

export async function productsRequest(): Promise<Product[]> {
  const { data } = await apiClient.get<{ products: Product[] }>('/products');
  return data.products;
}
