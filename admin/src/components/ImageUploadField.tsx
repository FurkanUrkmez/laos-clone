import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { uploadImageRequest } from '../api/uploads';
import { getApiErrorMessage } from '../api/errorMessage';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      onChange(await uploadImageRequest(file));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Resim yüklenemedi'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <label>
      {label}
      {value && (
        <img src={value} alt="" style={{ maxWidth: 160, display: 'block', marginBottom: 8, borderRadius: 8 }} />
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Yükleniyor…</p>}
      {error && <p className="error-text">{error}</p>}
    </label>
  );
}
