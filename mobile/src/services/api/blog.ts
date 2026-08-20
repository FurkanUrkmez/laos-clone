import { apiClient } from './client';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export interface BlogPostsPage {
  posts: BlogPost[];
  page: number;
  hasMore: boolean;
}

export async function blogPostsRequest(page = 1, limit = 10): Promise<BlogPostsPage> {
  const { data } = await apiClient.get<BlogPostsPage>('/blog', { params: { page, limit } });
  return data;
}
