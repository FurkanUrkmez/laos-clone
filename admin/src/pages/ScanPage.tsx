import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listProductsRequest } from '../api/products';
import { redeemRequest, scanRequest } from '../api/loyalty';
import { getApiErrorMessage } from '../api/errorMessage';
import type { ScanResult } from '../types';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

type Identifier = { type: 'qr'; value: string } | { type: 'code'; value: string };

export function ScanPage() {
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: listProductsRequest });
  const redeemableProducts = products.filter((product) => product.redeemable);
  const [productId, setProductId] = useState('');
  const [rewardProductId, setRewardProductId] = useState('');
  const [manualQrValue, setManualQrValue] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannedQrValue, setScannedQrValue] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // The exact identifier that produced `scanResult`/`currentUserId`. The
  // redeem button is only shown while this still matches what's currently
  // displayed (camera feed, manual QR text, or 6-digit code) — see the
  // guard below.
  const [resultIdentifier, setResultIdentifier] = useState<Identifier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Mirrors `scannedQrValue` for use inside the decode callback below, whose
  // closure is created once (effect has an empty dependency array) and would
  // otherwise never see state updates.
  const lastScannedQrValueRef = useRef<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (decodedText === lastScannedQrValueRef.current) {
            return;
          }
          lastScannedQrValueRef.current = decodedText;
          setScannedQrValue(decodedText);
          // The camera is now pointed at a different code than whatever
          // produced the current result — any stale balance/eligibility
          // for the previous customer must not carry over.
          setScanResult(null);
          setCurrentUserId(null);
          setResultIdentifier(null);
          setError(null);
        },
        () => {},
      )
      .catch(() => setCameraError(true));

    return () => {
      try {
        // start() is async and may not have resolved yet when this cleanup
        // runs (e.g. React StrictMode's extra dev-mode mount/unmount, or a
        // fast navigation away from the page) — in that case the scanner
        // isn't actually running yet and stop() throws *synchronously*
        // ("Cannot stop, scanner is not running or paused"), which a
        // trailing .catch() alone doesn't protect against.
        scanner.stop().catch(() => {});
      } catch {
        // Nothing was running; safe to ignore.
      }
    };
  }, []);

  const scanMutation = useMutation({
    mutationFn: ({ identifier, productId: pid }: { identifier: Identifier; productId: string }) =>
      scanRequest(identifier.type === 'qr' ? { qrValue: identifier.value } : { loyaltyCode: identifier.value }, pid),
    onSuccess: (result, variables) => {
      setScanResult(result);
      setCurrentUserId(result.userId);
      setResultIdentifier(variables.identifier);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Puan eklenemedi. QR kodu veya kodu kontrol edin.')),
  });

  const redeemMutation = useMutation({
    mutationFn: (userId: string) => redeemRequest(userId, rewardProductId || undefined),
    onSuccess: (result) => {
      setScanResult((prev) =>
        prev
          ? { ...prev, pointsBalance: result.pointsBalance, rewardEligible: result.pointsBalance >= prev.threshold }
          : prev,
      );
      setRewardProductId('');
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Ödül verilemedi')),
  });

  function handleAddPoints(identifier: Identifier) {
    if (!productId) {
      setError('Önce bir ürün seçin');
      return;
    }
    scanMutation.mutate({ identifier, productId });
  }

  // The redeem action must only be available while the result on screen
  // still corresponds to what's currently displayed — the live camera feed,
  // the manual QR text field, or the 6-digit code field, whichever produced
  // it. This is derived directly from the current values every render
  // instead of being tracked as its own piece of state, so it can't drift
  // out of sync with them.
  const isResultCurrent =
    resultIdentifier !== null &&
    ((resultIdentifier.type === 'qr' &&
      (resultIdentifier.value === scannedQrValue || resultIdentifier.value === manualQrValue)) ||
      (resultIdentifier.type === 'code' && resultIdentifier.value === manualCode));
  // Non-null only when every condition holds, so using it below never needs
  // a non-null assertion.
  const redeemableUserId = scanResult?.rewardEligible && isResultCurrent ? currentUserId : null;

  return (
    <div>
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
          <p>Kamera kullanılamıyor, QR metnini veya müşteri kodunu elle girin.</p>
        )}
        <label>
          Manuel QR Metni
          <input value={manualQrValue} onChange={(e) => setManualQrValue(e.target.value)} placeholder="laos-clone:user:..." />
        </label>
        <button
          type="button"
          onClick={() => handleAddPoints({ type: 'qr', value: manualQrValue })}
          disabled={!manualQrValue}
        >
          Puan Ekle
        </button>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <label>
          6 Haneli Müşteri Kodu
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
          />
        </label>
        <button
          type="button"
          onClick={() => handleAddPoints({ type: 'code', value: manualCode })}
          disabled={manualCode.length !== 6}
        >
          Puan Ekle
        </button>
      </div>

      {scannedQrValue && (
        <div className="card" style={{ maxWidth: 480 }}>
          <p>Okunan kod: {scannedQrValue}</p>
          <button
            type="button"
            onClick={() => handleAddPoints({ type: 'qr', value: scannedQrValue })}
            disabled={scanMutation.isPending}
          >
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
          {redeemableUserId && (
            <>
              {redeemableProducts.length > 0 && (
                <label>
                  Ödül Ürünü
                  <select value={rewardProductId} onChange={(e) => setRewardProductId(e.target.value)}>
                    <option value="">Ürün seçin</option>
                    {redeemableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={() => redeemMutation.mutate(redeemableUserId)}
                disabled={redeemMutation.isPending || (redeemableProducts.length > 0 && !rewardProductId)}
              >
                Ücretsiz Ürün Ver
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
