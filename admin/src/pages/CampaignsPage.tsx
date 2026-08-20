import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CampaignInput } from '../api/campaigns';
import {
  createCampaignRequest,
  deleteCampaignRequest,
  listCampaignsRequest,
  updateCampaignRequest,
} from '../api/campaigns';
import { getApiErrorMessage } from '../api/errorMessage';
import { ImageUploadField } from '../components/ImageUploadField';
import type { Campaign } from '../types';

const emptyForm: CampaignInput = { title: '', description: '', startDate: '', endDate: '', isActive: true };

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: listCampaignsRequest,
  });
  const [form, setForm] = useState<CampaignInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] });

  const createMutation = useMutation({
    mutationFn: createCampaignRequest,
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Kampanya eklenemedi')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CampaignInput> }) =>
      updateCampaignRequest(id, input),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Kampanya güncellenemedi')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaignRequest,
    onSuccess: () => {
      invalidate();
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Kampanya silinemedi')),
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

  function startEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      description: campaign.description ?? '',
      imageUrl: campaign.imageUrl ?? undefined,
      startDate: campaign.startDate.slice(0, 10),
      endDate: campaign.endDate.slice(0, 10),
      isActive: campaign.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Kampanyalar</h2>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>
          Başlık
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          Açıklama
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label>
          Başlangıç Tarihi
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </label>
        <ImageUploadField
          label="Kampanya Görseli"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
        <label>
          Bitiş Tarihi
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
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
        campaigns.map((campaign) => (
          <div key={campaign.id} className="card">
            {campaign.imageUrl && (
              <img src={campaign.imageUrl} alt="" style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }} />
            )}
            <strong>{campaign.title}</strong> {campaign.isActive ? '' : '(pasif)'}
            <p>{campaign.description}</p>
            <p>
              {campaign.startDate.slice(0, 10)} — {campaign.endDate.slice(0, 10)}
            </p>
            <div className="row-actions">
              <button type="button" onClick={() => startEdit(campaign)}>
                Düzenle
              </button>
              <button type="button" onClick={() => deleteMutation.mutate(campaign.id)}>
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
