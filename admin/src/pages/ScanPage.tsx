import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listProductsRequest } from '../api/products';
import { redeemRequest, scanRequest } from '../api/loyalty';
import type { ScanResult } from '../types';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

export function ScanPage() {
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: listProductsRequest });
  const [productId, setProductId] = useState('');
  const [manualQrValue, setManualQrValue] = useState('');
  const [scannedQrValue, setScannedQrValue] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => setScannedQrValue(decodedText),
        () => {},
      )
      .catch(() => setCameraError(true));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  const scanMutation = useMutation({
    mutationFn: ({ qrValue, productId: pid }: { qrValue: string; productId: string }) =>
      scanRequest(qrValue, pid),
    onSuccess: (result, variables) => {
      setScanResult(result);
      setCurrentUserId(variables.qrValue.replace('laos-clone:user:', ''));
      setError(null);
    },
    onError: () => setError('Puan eklenemedi. QR kodu veya ürünü kontrol edin.'),
  });

  const redeemMutation = useMutation({
    mutationFn: (userId: string) => redeemRequest(userId),
    onSuccess: (result) => {
      setScanResult((prev) => (prev ? { ...prev, pointsBalance: result.pointsBalance, rewardEligible: false } : prev));
    },
    onError: () => setError('Ödül verilemedi'),
  });

  function handleAddPoints(qrValue: string) {
    if (!productId) {
      setError('Önce bir ürün seçin');
      return;
    }
    scanMutation.mutate({ qrValue, productId });
  }

  return (
    <div>
      <h2>QR Tarayıcı</h2>

      <div className="card" style={{ maxWidth: 480 }}>
        <label>
          Ürün
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Ürün seçin</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (+{product.pointsReward} puan)
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {!cameraError ? (
          <div id={SCANNER_ELEMENT_ID} style={{ width: '100%' }} />
        ) : (
          <p>Kamera kullanılamıyor, QR metnini elle girin.</p>
        )}
        <label>
          Manuel QR Metni
          <input value={manualQrValue} onChange={(e) => setManualQrValue(e.target.value)} placeholder="laos-clone:user:..." />
        </label>
        <button type="button" onClick={() => handleAddPoints(manualQrValue)} disabled={!manualQrValue}>
          Puan Ekle
        </button>
      </div>

      {scannedQrValue && (
        <div className="card" style={{ maxWidth: 480 }}>
          <p>Okunan kod: {scannedQrValue}</p>
          <button type="button" onClick={() => handleAddPoints(scannedQrValue)} disabled={scanMutation.isPending}>
            Puan Ekle
          </button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {scanResult && (
        <div className="card" style={{ maxWidth: 480 }}>
          <p>
            Güncel bakiye: {scanResult.pointsBalance} / {scanResult.threshold}
          </p>
          {scanResult.rewardEligible && currentUserId && (
            <button type="button" onClick={() => redeemMutation.mutate(currentUserId)} disabled={redeemMutation.isPending}>
              Ücretsiz Ürün Ver
            </button>
          )}
        </div>
      )}
    </div>
  );
}
