import type { BlogPost } from '../types';
import { apiClient } from './client';

export interface BlogPostInput {
  title: string;
  content: string;
  coverImageUrl?: string;
  isPublished?: boolean;
}

export async function listBlogPostsRequest(): Promise<BlogPost[]> {
  const { data } = await apiClient.get<{ posts: BlogPost[] }>('/admin/blog-posts');
  return data.posts;
}

export async function createBlogPostRequest(input: BlogPostInput): Promise<BlogPost> {
  const { data } = await apiClient.post<{ post: BlogPost }>('/admin/blog-posts', input);
  return data.post;
}

export async function updateBlogPostRequest(id: string, input: Partial<BlogPostInput>): Promise<BlogPost> {
  const { data } = await apiClient.patch<{ post: BlogPost }>(`/admin/blog-posts/${id}`, input);
  return data.post;
}

export async function deleteBlogPostRequest(id: string): Promise<void> {
  await apiClient.delete(`/admin/blog-posts/${id}`);
}
