export interface AdminUser {
  id: string;
  businessId: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  workingHours: Record<string, string>;
  loyaltyTargetCups: number;
}

export interface Campaign {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  businessId: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  pointsBalance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  pointsReward: number;
  price: string;
  isActive: boolean;
}

export interface ScanResult {
  userId: string;
  pointsBalance: number;
  rewardEligible: boolean;
  threshold: number;
}

export interface RedeemResult {
  pointsBalance: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
