import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBusinessRequest, updateBusinessRequest } from '../api/business';
import { listCustomersRequest } from '../api/customers';
import { getApiErrorMessage } from '../api/errorMessage';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { StatCard } from '../components/StatCard';
import type { Business } from '../types';

type FormState = Pick<
  Business,
  'name' | 'category' | 'address' | 'phone' | 'email' | 'loyaltyTargetCups'
>;

export function BusinessPage() {
  const queryClient = useQueryClient();
  const { data: business, isLoading } = useQuery({ queryKey: ['business'], queryFn: getBusinessRequest });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: listCustomersRequest });
  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name,
        category: business.category,
        address: business.address,
        phone: business.phone,
        email: business.email,
        loyaltyTargetCups: business.loyaltyTargetCups,
      });
    }
  }, [business]);

  const mutation = useMutation({
    mutationFn: (input: FormState) => updateBusinessRequest(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['business'], updated);
      setMessage('Kaydedildi');
      setError(null);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'İşletme bilgileri kaydedilemedi'));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setMessage(null);
    setError(null);
    mutation.mutate(form);
  }

  if (isLoading || !form) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div>
      <div className="stats-row">
        <StatCard label="Hedef Fincan" value={form.loyaltyTargetCups} />
        <StatCard label="Kayıtlı Müşteri" value={customers.length} />
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <FormField label="İşletme Adı">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormField>
        <FormField label="Kategori">
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Adres">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Telefon">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </FormField>
        <FormField label="E-posta">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Ücretsiz Ürün Puan Eşiği">
          <input
            type="number"
            min={1}
            value={form.loyaltyTargetCups}
            onChange={(e) => setForm({ ...form, loyaltyTargetCups: Number(e.target.value) })}
            required
          />
        </FormField>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        {message && <p style={{ color: 'var(--color-accent)', marginTop: 8 }}>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
