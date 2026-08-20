import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BlogPostInput } from '../api/blogPosts';
import {
  createBlogPostRequest,
  deleteBlogPostRequest,
  listBlogPostsRequest,
  updateBlogPostRequest,
} from '../api/blogPosts';
import { getApiErrorMessage } from '../api/errorMessage';
import { resolveAssetUrl } from '../api/assetUrl';
import { ImageUploadField } from '../components/ImageUploadField';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CheckboxField } from '../components/CheckboxField';
import { FormField } from '../components/FormField';
import type { BlogPost } from '../types';

const emptyForm: BlogPostInput = { title: '', content: '', coverImageUrl: undefined, isPublished: false };

export function BlogPage() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery({ queryKey: ['blogPosts'], queryFn: listBlogPostsRequest });
  const [form, setForm] = useState<BlogPostInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['blogPosts'] });

  const createMutation = useMutation({
    mutationFn: createBlogPostRequest,
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Yazı eklenemedi')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BlogPostInput> }) =>
      updateBlogPostRequest(id, input),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Yazı güncellenemedi')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPostRequest,
    onSuccess: () => {
      invalidate();
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Yazı silinemedi')),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      content: post.content,
      coverImageUrl: post.coverImageUrl ?? undefined,
      isPublished: post.isPublished,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <FormField label="Başlık">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </FormField>
        <FormField label="İçerik">
          <textarea
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </FormField>
        <ImageUploadField
          label="Kapak Görseli"
          value={form.coverImageUrl}
          onChange={(url) => setForm({ ...form, coverImageUrl: url })}
        />
        <CheckboxField
          label="Yayınla"
          checked={form.isPublished ?? false}
          onChange={(checked) => setForm({ ...form, isPublished: checked })}
        />
        <div className="row-actions">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingId ? 'Güncelle' : 'Ekle'}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={cancelEdit}>
              Vazgeç
            </Button>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {isLoading ? (
        <p>Yükleniyor...</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card">
            {post.coverImageUrl && (
              <img
                src={resolveAssetUrl(post.coverImageUrl) ?? undefined}
                alt=""
                style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }}
              />
            )}
            <strong>{post.title}</strong>
            <Badge tone={post.isPublished ? 'accent' : 'neutral'}>
              {post.isPublished ? 'Yayında' : 'Taslak'}
            </Badge>
            <p>/{post.slug}</p>
            <div className="row-actions">
              <Button type="button" variant="ghost" onClick={() => startEdit(post)}>
                Düzenle
              </Button>
              <Button type="button" variant="danger" onClick={() => deleteMutation.mutate(post.id)}>
                Sil
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
