# Admin Panel Dark Redesign — Rollout to Remaining Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spread the dark design system (already built and approved for Business + Products in the prior plan) to the remaining admin panel pages — Campaigns, Blog, Customers, Scan — so the whole panel uses the same components consistently.

**Architecture:** Two small additions to the existing component/CSS system (a `CheckboxField` component to replace the hand-rolled checkbox markup duplicated across pages, and a third `Badge` tone for Blog's two-state publish status), then rewire each remaining page's JSX to use `FormField`/`Button`/`Badge`/`CheckboxField` in place of raw HTML — no behavior changes, no new endpoints, no new dependencies.

**Tech Stack:** Vite + React 19 + TypeScript, TanStack Query (existing), the component set from the prior plan (`Button`, `Badge`, `StatCard`, `FormField`).

**Prior plan (context, not required reading):** `docs/superpowers/plans/2026-08-20-admin-panel-dark-redesign.md`
**Design spec (context, not required reading):** `docs/superpowers/specs/2026-08-20-admin-panel-dark-redesign-design.md`

## Global Constraints

- Dark theme only — no light/dark toggle. All tokens already exist in `admin/src/index.css` (`--color-bg`, `--color-sidebar`, `--color-card`, `--color-border`, `--color-accent:#D9A566`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-danger`). This plan does not change any existing token value.
- No new backend endpoints, no new npm dependencies, no Tailwind/shadcn.
- Presentation-only changes: every page task preserves its existing mutations, query keys, `onSuccess`/`onError` handlers, and form-reset/edit-population logic exactly. Only JSX/markup changes.
- `Badge`'s existing tones (`neutral`, `danger`) keep their current meaning (`neutral` = informational/off-state, `danger` = destructive/inactive-state). The new `accent` tone is for a positive/highlighted state (Blog's "published"), reusing `--color-accent` — no new color is introduced.
- `CheckboxField` replaces every remaining hand-rolled `<label><input type="checkbox" .../> text</label>` pattern in `admin/src/pages/*.tsx`, including the two already in `ProductsPage.tsx` (built before `CheckboxField` existed) — after this plan, no page should have an inline checkbox `style={{ width: 'auto', ... }}` override left.

---

### Task 1: CheckboxField component

**Files:**
- Create: `admin/src/components/CheckboxField.tsx`
- Modify: `admin/src/index.css` (add `.checkbox-field` rules)

**Interfaces:**
- Produces: `CheckboxField(props: { label: string; checked: boolean; onChange: (checked: boolean) => void })`, named export `CheckboxField` — consumed by Tasks 3, 4, and 5.

- [ ] **Step 1: Create `admin/src/components/CheckboxField.tsx`**

```tsx
interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="checkbox-field">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
```

- [ ] **Step 2: Add to `admin/src/index.css`**

Append this block to the end of the file (after the existing `.field input, .field textarea, .field select { margin-bottom: 0; }` rule):

```css

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--color-text-primary);
  font-size: 14px;
}

.checkbox-field input[type='checkbox'] {
  width: auto;
  margin: 0;
}
```

- [ ] **Step 3: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/CheckboxField.tsx admin/src/index.css
git commit -m "admin: add CheckboxField component"
```

---

### Task 2: Badge 'accent' tone

**Files:**
- Modify: `admin/src/components/Badge.tsx`
- Modify: `admin/src/index.css` (add `.badge-accent`)

**Interfaces:**
- Consumes: `--color-accent` (existing token, `admin/src/index.css`).
- Produces: `Badge`'s `tone` prop widens from `'neutral' | 'danger'` to `'neutral' | 'danger' | 'accent'` — consumed by Task 4 (`<Badge tone="accent">`).

- [ ] **Step 1: Replace `admin/src/components/Badge.tsx`**

```tsx
import type { ReactNode } from 'react';

type BadgeTone = 'neutral' | 'danger' | 'accent';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
```

- [ ] **Step 2: Add to `admin/src/index.css`**

Append this block right after the existing `.badge-danger { ... }` rule:

```css

.badge-accent {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  color: var(--color-accent);
}
```

- [ ] **Step 3: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/Badge.tsx admin/src/index.css
git commit -m "admin: add accent Badge tone for positive/highlighted states"
```

---

### Task 3: CampaignsPage rework

**Files:**
- Modify: `admin/src/pages/CampaignsPage.tsx` (full replacement — see below)

**Interfaces:**
- Consumes: `Button`, `Badge` (existing, from the prior plan), `CheckboxField` (Task 1), `FormField` (existing, from the prior plan). All existing API/type imports (`admin/src/api/campaigns.ts`, `admin/src/api/assetUrl.ts`, `admin/src/components/ImageUploadField.tsx`, `admin/src/types`) are unchanged.

- [ ] **Step 1: Replace `admin/src/pages/CampaignsPage.tsx`**

```tsx
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
import { resolveAssetUrl } from '../api/assetUrl';
import { ImageUploadField } from '../components/ImageUploadField';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CheckboxField } from '../components/CheckboxField';
import { FormField } from '../components/FormField';
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
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <FormField label="Başlık">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </FormField>
        <FormField label="Açıklama">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
        <FormField label="Başlangıç Tarihi">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </FormField>
        <ImageUploadField
          label="Kampanya Görseli"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
        <FormField label="Bitiş Tarihi">
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </FormField>
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
        campaigns.map((campaign) => (
          <div key={campaign.id} className="card">
            {campaign.imageUrl && (
              <img
                src={resolveAssetUrl(campaign.imageUrl) ?? undefined}
                alt=""
                style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }}
              />
            )}
            <strong>{campaign.title}</strong>
            {!campaign.isActive && <Badge tone="danger">Pasif</Badge>}
            <p>{campaign.description}</p>
            <p>
              {campaign.startDate.slice(0, 10)} — {campaign.endDate.slice(0, 10)}
            </p>
            <div className="row-actions">
              <Button type="button" variant="ghost" onClick={() => startEdit(campaign)}>
                Düzenle
              </Button>
              <Button type="button" variant="danger" onClick={() => deleteMutation.mutate(campaign.id)}>
                Sil
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 3: Manual check**

No browser tool is available in this environment. Start the dev server in the background (`npm run dev` from `admin/`), `curl` the local URL to confirm HTTP 200, then stop it. A human will do the real visual check later.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/CampaignsPage.tsx
git commit -m "admin: rework CampaignsPage with Button/Badge/FormField/CheckboxField"
```

---

### Task 4: BlogPage rework

**Files:**
- Modify: `admin/src/pages/BlogPage.tsx` (full replacement — see below)

**Interfaces:**
- Consumes: `Button`, `FormField` (existing), `Badge` with the new `accent` tone (Task 2), `CheckboxField` (Task 1).

- [ ] **Step 1: Replace `admin/src/pages/BlogPage.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 3: Manual check**

Same as Task 3 Step 3 — no browser tool available; start `npm run dev`, `curl` for HTTP 200, stop it.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/BlogPage.tsx
git commit -m "admin: rework BlogPage with Button/FormField/CheckboxField, accent Badge for publish status"
```

---

### Task 5: Small touch-ups — CustomersPage card wrapper + ProductsPage checkbox retrofit

**Files:**
- Modify: `admin/src/pages/CustomersPage.tsx` (full replacement — see below)
- Modify: `admin/src/pages/ProductsPage.tsx` (two `<label>` blocks replaced with `<CheckboxField>` — see below)

**Interfaces:**
- Consumes: `CheckboxField` (Task 1).

- [ ] **Step 1: Replace `admin/src/pages/CustomersPage.tsx`**

CustomersPage has no form and no status field to badge — its table already inherits the dark palette from the shared base styles. The only change is wrapping the table in a `.card` container so it matches the card-bounded visual language every other page uses (currently it's the only page whose content sits directly on the page background with no card border).

```tsx
import { useQuery } from '@tanstack/react-query';
import { listCustomersRequest } from '../api/customers';

export function CustomersPage() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: listCustomersRequest,
  });

  if (isLoading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Telefon</th>
            <th>Kod</th>
            <th>Puan</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.fullName}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.loyaltyCode}</td>
              <td>{customer.pointsBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Retrofit `admin/src/pages/ProductsPage.tsx`'s two checkboxes**

`ProductsPage.tsx` was built (in the prior plan) before `CheckboxField` existed, so it still has two hand-rolled checkbox `<label>` blocks with an inline `style={{ width: 'auto', display: 'inline-block', marginRight: 8 }}` override — the exact pattern `CheckboxField` exists to replace.

Add this import alongside the existing component imports (after the `FormField` import line):
```tsx
import { CheckboxField } from '../components/CheckboxField';
```

Replace these two blocks:
```tsx
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
```

with:
```tsx
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
```

(`redeemable`/`isActive` are optional on `ProductInput`, so `CheckboxField`'s non-optional `checked: boolean` prop needs the `?? true` fallback — same reasoning as Task 3's Campaigns "Aktif" checkbox: `emptyForm` always sets both to `true` and `startEdit` always populates them from a loaded `Product`, so this is a compile-time-only satisfier, never an actual runtime fallback.)

Nothing else in `ProductsPage.tsx` changes.

- [ ] **Step 3: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 4: Manual check**

Same as Task 3 Step 3 — no browser tool available; start `npm run dev`, `curl` for HTTP 200, stop it.

- [ ] **Step 5: Commit**

```bash
git add admin/src/pages/CustomersPage.tsx admin/src/pages/ProductsPage.tsx
git commit -m "admin: wrap CustomersPage table in a card, retrofit ProductsPage checkboxes to CheckboxField"
```

---

### Task 6: ScanPage rework

**Files:**
- Modify: `admin/src/pages/ScanPage.tsx` (full replacement — see below)

**Interfaces:**
- Consumes: `Button`, `FormField` (existing, from the prior plan).

This is the largest of the remaining pages (camera scanner, two manual-entry cards, a result card with a conditional reward-product picker) but the change is still presentation-only: every `useState`, the `useEffect` camera lifecycle (including its try/catch cleanup fix), both `useMutation` calls, `handleAddPoints`, and the `isResultCurrent`/`redeemableUserId` derivations are copied verbatim from the current file — only `<label>...</label>` becomes `<FormField label="...">...</FormField>` and `<button>` becomes `<Button>`.

- [ ] **Step 1: Replace `admin/src/pages/ScanPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listProductsRequest } from '../api/products';
import { redeemRequest, scanRequest } from '../api/loyalty';
import { getApiErrorMessage } from '../api/errorMessage';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
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
        <FormField label="Ürün">
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Ürün seçin</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (+{product.pointsReward} puan)
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {!cameraError ? (
          <div id={SCANNER_ELEMENT_ID} style={{ width: '100%' }} />
        ) : (
          <p>Kamera kullanılamıyor, QR metnini veya müşteri kodunu elle girin.</p>
        )}
        <FormField label="Manuel QR Metni">
          <input value={manualQrValue} onChange={(e) => setManualQrValue(e.target.value)} placeholder="laos-clone:user:..." />
        </FormField>
        <Button
          type="button"
          onClick={() => handleAddPoints({ type: 'qr', value: manualQrValue })}
          disabled={!manualQrValue}
        >
          Puan Ekle
        </Button>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <FormField label="6 Haneli Müşteri Kodu">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
          />
        </FormField>
        <Button
          type="button"
          onClick={() => handleAddPoints({ type: 'code', value: manualCode })}
          disabled={manualCode.length !== 6}
        >
          Puan Ekle
        </Button>
      </div>

      {scannedQrValue && (
        <div className="card" style={{ maxWidth: 480 }}>
          <p>Okunan kod: {scannedQrValue}</p>
          <Button
            type="button"
            onClick={() => handleAddPoints({ type: 'qr', value: scannedQrValue })}
            disabled={scanMutation.isPending}
          >
            Puan Ekle
          </Button>
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
                <FormField label="Ödül Ürünü">
                  <select value={rewardProductId} onChange={(e) => setRewardProductId(e.target.value)}>
                    <option value="">Ürün seçin</option>
                    {redeemableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
              <Button
                type="button"
                onClick={() => redeemMutation.mutate(redeemableUserId)}
                disabled={redeemMutation.isPending || (redeemableProducts.length > 0 && !rewardProductId)}
              >
                Ücretsiz Ürün Ver
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 3: Manual check**

No browser tool available. Start `npm run dev` from `admin/`, `curl` the local URL for HTTP 200, then stop it. A human will do the real visual/camera check later (this page's camera behavior in particular needs eyes-on testing that no automated check here can substitute for).

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/ScanPage.tsx
git commit -m "admin: rework ScanPage with Button/FormField"
```

---

### Task 7: Push

- [ ] **Step 1: Push all commits**

```bash
git push origin master
```
Expected: exits 0, remote `master` now includes all 6 commits from Tasks 1–6.
