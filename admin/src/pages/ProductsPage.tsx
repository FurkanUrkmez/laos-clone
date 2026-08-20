import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductInput } from '../api/products';
import {
  createProductRequest,
  deleteProductRequest,
  listProductsRequest,
  updateProductRequest,
} from '../api/products';
import { getApiErrorMessage } from '../api/errorMessage';
import { resolveAssetUrl } from '../api/assetUrl';
import { ImageUploadField } from '../components/ImageUploadField';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { FormField } from '../components/FormField';
import { CheckboxField } from '../components/CheckboxField';
import type { Product } from '../types';

const emptyForm: ProductInput = {
  name: '',
  description: '',
  imageUrl: undefined,
  price: 0,
  pointsReward: 1,
  categoryName: '',
  redeemable: true,
  isActive: true,
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: listProductsRequest });
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const createMutation = useMutation({
    mutationFn: createProductRequest,
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Ürün eklenemedi')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) => updateProductRequest(id, input),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Ürün güncellenemedi')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductRequest,
    onSuccess: () => {
      invalidate();
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Ürün silinemedi')),
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

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? undefined,
      price: Number(product.price),
      pointsReward: product.pointsReward,
      categoryName: product.categoryName,
      redeemable: product.redeemable,
      isActive: product.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <FormField label="Ürün Adı">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormField>
        <FormField label="Açıklama">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
        <FormField label="Kategori">
          <input
            value={form.categoryName}
            onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
            placeholder="Örn. Espresso Sıcak"
            required
          />
        </FormField>
        <FormField label="Fiyat (₺)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
        </FormField>
        <FormField label="Kazandırdığı Puan">
          <input
            type="number"
            min="0"
            step="1"
            value={form.pointsReward}
            onChange={(e) => setForm({ ...form, pointsReward: Number(e.target.value) })}
            required
          />
        </FormField>
        <ImageUploadField
          label="Ürün Görseli"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
        <CheckboxField
          label="Puanla alınabilir (ödül olarak verilebilir)"
          checked={form.redeemable ?? true}
          onChange={(checked) => setForm({ ...form, redeemable: checked })}
        />
        <CheckboxField
          label="Aktif"
          checked={form.isActive ?? true}
          onChange={(checked) => setForm({ ...form, isActive: checked })}
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
        products.map((product) => (
          <div key={product.id} className="card">
            {product.imageUrl && (
              <img
                src={resolveAssetUrl(product.imageUrl) ?? undefined}
                alt=""
                style={{ maxWidth: 120, borderRadius: 8, marginBottom: 8 }}
              />
            )}
            <strong>{product.name}</strong>
            {!product.isActive && <Badge tone="danger">Pasif</Badge>}
            {!product.redeemable && <Badge tone="neutral">Ödül olarak verilemez</Badge>}
            <p>
              {product.categoryName} — {product.price}₺ — +{product.pointsReward} puan
            </p>
            {product.description && <p>{product.description}</p>}
            <div className="row-actions">
              <Button type="button" variant="ghost" onClick={() => startEdit(product)}>
                Düzenle
              </Button>
              <Button type="button" variant="danger" onClick={() => deleteMutation.mutate(product.id)}>
                Sil
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
