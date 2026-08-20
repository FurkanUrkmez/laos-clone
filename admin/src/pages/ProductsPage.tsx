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
      <h2>Ürünler</h2>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>
          Ürün Adı
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Açıklama
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label>
          Kategori
          <input
            value={form.categoryName}
            onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
            placeholder="Örn. Espresso Sıcak"
            required
          />
        </label>
        <label>
          Fiyat (₺)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
        </label>
        <label>
          Kazandırdığı Puan
          <input
            type="number"
            min="0"
            step="1"
            value={form.pointsReward}
            onChange={(e) => setForm({ ...form, pointsReward: Number(e.target.value) })}
            required
          />
        </label>
        <ImageUploadField
          label="Ürün Görseli"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
        <label>
          <input
            type="checkbox"
            checked={form.redeemable}
            onChange={(e) => setForm({ ...form, redeemable: e.target.checked })}
            style={{ width: 'auto', display: 'inline-block', marginRight: 8 }}
          />
          Puanla alınabilir (ödül olarak verilebilir)
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            style={{ width: 'auto', display: 'inline-block', marginRight: 8 }}
          />
          Aktif
        </label>
        <div className="row-actions">
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Vazgeç
            </button>
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
            <strong>{product.name}</strong> {product.isActive ? '' : '(pasif)'}
            <p>
              {product.categoryName} — {product.price}₺ — +{product.pointsReward} puan
              {!product.redeemable && ' — ödül olarak verilemez'}
            </p>
            {product.description && <p>{product.description}</p>}
            <div className="row-actions">
              <button type="button" onClick={() => startEdit(product)}>
                Düzenle
              </button>
              <button type="button" onClick={() => deleteMutation.mutate(product.id)}>
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
