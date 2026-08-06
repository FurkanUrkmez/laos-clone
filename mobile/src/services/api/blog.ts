import { apiClient } from './client';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export async function blogPostsRequest(): Promise<BlogPost[]> {
  const { data } = await apiClient.get<{ posts: BlogPost[] }>('/blog');
  return data.posts;
}
