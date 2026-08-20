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

export interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export async function blogPostsRequest(page = 1, limit = 10): Promise<BlogPostsPage> {
  const { data } = await apiClient.get<BlogPostsPage>('/blog', { params: { page, limit } });
  return data;
}

export async function blogPostRequest(id: string): Promise<BlogPostDetail> {
  const { data } = await apiClient.get<{ post: BlogPostDetail }>(`/blog/${id}`);
  return data.post;
}
