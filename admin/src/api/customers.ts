import type { Customer } from '../types';
import { apiClient } from './client';

export async function listCustomersRequest(): Promise<Customer[]> {
  const { data } = await apiClient.get<{ customers: Customer[] }>('/admin/customers');
  return data.customers;
}
