import type { IconName } from '../types';

export interface MockCategory {
  id: string;
  name: string;
}

export interface MockProduct {
  id: string;
  categoryId: string;
  name: string;
  pointsReward: number;
  icon: IconName;
}

export interface MockBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

export interface MockCampaign {
  id: string;
  title: string;
  description: string;
  icon: IconName;
}

export const mockCategories: MockCategory[] = [
  { id: 'icecekler', name: 'İçecekler' },
  { id: 'espresso-sicak', name: 'Espresso Sıcak' },
  { id: 'diger-sicaklar', name: 'Diğer Sıcaklar' },
  { id: 'espresso-soguk', name: 'Espresso Soğuk' },
];

export const mockProducts: MockProduct[] = [
  { id: 'p1', categoryId: 'icecekler', name: 'Limonata', pointsReward: 1, icon: 'water-outline' },
  { id: 'p2', categoryId: 'icecekler', name: 'Ice Tea', pointsReward: 1, icon: 'leaf-outline' },
  { id: 'p3', categoryId: 'espresso-sicak', name: 'Latte', pointsReward: 1, icon: 'cafe-outline' },
  { id: 'p4', categoryId: 'espresso-sicak', name: 'Cappuccino', pointsReward: 1, icon: 'cafe-outline' },
  { id: 'p5', categoryId: 'espresso-sicak', name: 'Americano', pointsReward: 1, icon: 'cafe-outline' },
  { id: 'p6', categoryId: 'diger-sicaklar', name: 'Filtre Kahve', pointsReward: 1, icon: 'flame-outline' },
  { id: 'p7', categoryId: 'diger-sicaklar', name: 'Sıcak Çikolata', pointsReward: 1, icon: 'flame-outline' },
  { id: 'p8', categoryId: 'espresso-soguk', name: 'Ice Latte', pointsReward: 1, icon: 'snow-outline' },
  { id: 'p9', categoryId: 'espresso-soguk', name: 'Cold Brew', pointsReward: 1, icon: 'snow-outline' },
];

export const mockBranches: MockBranch[] = [
  {
    id: 'b1',
    name: 'Kadıköy Şubesi',
    address: 'Bağdat Cd. No:123, Kadıköy, İstanbul',
    phone: '+90 555 123 45 67',
    hours: '08:00 - 22:00',
  },
  {
    id: 'b2',
    name: 'Beşiktaş Şubesi',
    address: 'Barbaros Bulvarı No:45, Beşiktaş, İstanbul',
    phone: '+90 555 765 43 21',
    hours: '08:00 - 23:00',
  },
  {
    id: 'b3',
    name: 'Karşıyaka Şubesi',
    address: 'Cemal Gürsel Cd. No:9, Karşıyaka, İzmir',
    phone: '+90 555 111 22 33',
    hours: '09:00 - 22:00',
  },
];

export const mockCampaigns: MockCampaign[] = [
  {
    id: 'c1',
    title: '6 Kahvede 1 Hediye',
    description: '6 kahve al, 7.sini bizden kazan!',
    icon: 'gift-outline',
  },
  {
    id: 'c2',
    title: 'Hafta Sonu Kampanyası',
    description: 'Cumartesi-Pazar tüm soğuk içeceklerde %20 indirim',
    icon: 'pricetag-outline',
  },
  {
    id: 'c3',
    title: 'Blog: Kahve Çekirdeği Rehberi',
    description: 'Doğru demleme için çekirdek seçim rehberimiz',
    icon: 'book-outline',
  },
];
