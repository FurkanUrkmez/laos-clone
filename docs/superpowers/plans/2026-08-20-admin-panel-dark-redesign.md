# Admin Panel Dark Redesign (Pilot: Business + Products) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin panel a "Karanlık & Editoryal" (dark, high-contrast, amber-accent) visual identity with a Sidebar+Topbar layout, and apply it fully to the Business and Products pages as a pilot before spreading to the rest of the panel.

**Architecture:** Extend the existing plain-CSS setup (`admin/src/index.css`) with CSS custom properties for the new palette, add four small reusable React components (`Button`, `Badge`, `StatCard`, `FormField`), rewrite the shared `Layout.tsx` as Sidebar+Topbar, then rewire `BusinessPage.tsx` and `ProductsPage.tsx` to use the new components. No new build tooling (no Tailwind/shadcn) and no backend changes.

**Tech Stack:** Vite + React 19 + TypeScript, TanStack Query (existing), `lucide-react` (new, icons only).

**Design spec:** `docs/superpowers/specs/2026-08-20-admin-panel-dark-redesign-design.md`

## Global Constraints

- Dark theme only — no light/dark toggle, no light-theme token set.
- Palette (exact values, from the spec): `--color-bg:#171310`, `--color-sidebar:#0F0B08`, `--color-card:#211A15`, `--color-border:#322718`, `--color-accent:#D9A566`, `--color-text-primary:#EFE6DA`, `--color-text-secondary:#6B5C4E`, `--color-text-muted:#3A2E20`, `--color-danger:#E5484D`, `--radius:10px`, `--radius-full:999px`.
- No new backend endpoints. `BusinessPage`'s customer-count stat reuses the existing `listCustomersRequest` (`admin/src/api/customers.ts`), same `['customers']` query key already used by `CustomersPage.tsx` (cache-shared, no extra network cost beyond the first fetch).
- Only `Business` and `Products` pages get rewired to the new components in this pass. `Login`, `Campaigns`, `Blog`, `Customers`, `Scan` are untouched in this plan — they still render correctly because the *shared* base styles (`body`, `.card`, `input`/`select`/`textarea`, `button`, `table`) are retokenized too, so unmigrated pages inherit the dark palette without code changes.
- No automated test framework exists for `admin/` (confirmed: only `oxlint` + `tsc -b`, no Vitest/Jest). Verification per task is `npx tsc -b` (types) + `npm run build` (Vite build, catches CSS/JSX errors) from `admin/`. The final task adds a manual visual pass since layout/color correctness can't be verified from the command line.

---

### Task 1: Design tokens + shared component CSS

**Files:**
- Modify: `admin/package.json` (add `lucide-react` dependency)
- Modify: `admin/src/index.css` (full replacement — see below)

**Interfaces:**
- Produces: CSS custom properties (`--color-bg`, `--color-sidebar`, `--color-card`, `--color-border`, `--color-accent`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-danger`, `--radius`, `--radius-full`) and classes `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-danger`, `.badge`/`.badge-neutral`/`.badge-danger`, `.stats-row`/`.stat-card`/`.stat-card-label`/`.stat-card-value`, `.field`/`.field-label`, `.sidebar-nav`, `.topbar`/`.topbar-account`, `.main-area` — all consumed by Tasks 2–5.

- [ ] **Step 1: Install lucide-react**

Run from `admin/`:
```bash
npm install lucide-react
```
Expected: `package.json` gains a `"lucide-react": "^..."` line under `dependencies`.

- [ ] **Step 2: Replace `admin/src/index.css`**

Full file content:

```css
:root {
  --color-bg: #171310;
  --color-sidebar: #0F0B08;
  --color-card: #211A15;
  --color-border: #322718;
  --color-accent: #D9A566;
  --color-text-primary: #EFE6DA;
  --color-text-secondary: #6B5C4E;
  --color-text-muted: #3A2E20;
  --color-danger: #E5484D;

  --radius: 10px;
  --radius-full: 999px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text-primary);
}

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: var(--color-sidebar);
  color: var(--color-text-primary);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid var(--color-border);
}

.sidebar h1 {
  font-size: 18px;
  margin: 0 0 24px;
  color: var(--color-accent);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.sidebar a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.sidebar a.active,
.sidebar a:hover {
  background: var(--color-card);
  color: var(--color-text-primary);
}

.sidebar a.active {
  color: var(--color-accent);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.topbar h2 {
  margin: 0;
  font-size: 18px;
}

.topbar-account {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.content {
  flex: 1;
  padding: 32px;
  max-width: 960px;
}

.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-card {
  width: 320px;
  padding: 32px;
  border-radius: var(--radius);
  background: var(--color-card);
  border: 1px solid var(--color-border);
}

input,
textarea,
select {
  width: 100%;
  padding: 8px 10px;
  margin-top: 4px;
  margin-bottom: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text-primary);
}

input::placeholder,
textarea::placeholder {
  color: var(--color-text-secondary);
}

button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  background: var(--color-accent);
  color: var(--color-sidebar);
  font-size: 14px;
  font-weight: 600;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
}

.error-text {
  color: var(--color-danger);
  font-size: 13px;
  margin-bottom: 12px;
}

.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

/* Buttons (new component-driven variants; the bare `button` rule above still
   covers pages that haven't migrated to <Button>) */
.btn {
  cursor: pointer;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--color-sidebar);
}

.btn-ghost {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.btn-danger {
  background: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

/* Badge */
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.badge-neutral {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.badge-danger {
  background: rgba(229, 72, 77, 0.15);
  color: var(--color-danger);
}

/* Stat cards */
.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.stat-card-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
}

.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-accent);
}

/* Form field */
.field {
  display: block;
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.field input,
.field textarea,
.field select {
  margin-bottom: 0;
}
```

- [ ] **Step 3: Verify the build**

Run from `admin/`:
```bash
npm run build
```
Expected: exits 0, no CSS parse errors. (This will also fail if `lucide-react` didn't install correctly, since Vite resolves all imports during build — but nothing imports it yet, so this step is really just confirming the CSS is valid.)

- [ ] **Step 4: Commit**

```bash
git add admin/package.json admin/package-lock.json admin/src/index.css
git commit -m "admin: add dark theme design tokens and shared component CSS"
```

---

### Task 2: Button, Badge, StatCard, FormField components

**Files:**
- Create: `admin/src/components/Button.tsx`
- Create: `admin/src/components/Badge.tsx`
- Create: `admin/src/components/StatCard.tsx`
- Create: `admin/src/components/FormField.tsx`

**Interfaces:**
- Consumes: CSS classes `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-danger`, `.badge`/`.badge-neutral`/`.badge-danger`, `.stat-card`/`.stat-card-label`/`.stat-card-value`, `.field`/`.field-label` (Task 1).
- Produces:
  - `Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' })` — default export none, named export `Button`.
  - `Badge(props: { tone?: 'neutral' | 'danger'; children: ReactNode })` — named export `Badge`.
  - `StatCard(props: { label: string; value: string | number })` — named export `StatCard`.
  - `FormField(props: { label: string; children: ReactNode })` — named export `FormField`.
  - All consumed by Tasks 3–5.

- [ ] **Step 1: Create `admin/src/components/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const classes = ['btn', variantClassNames[variant], className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
```

- [ ] **Step 2: Create `admin/src/components/Badge.tsx`**

```tsx
import type { ReactNode } from 'react';

type BadgeTone = 'neutral' | 'danger';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
```

- [ ] **Step 3: Create `admin/src/components/StatCard.tsx`**

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
}
```

- [ ] **Step 4: Create `admin/src/components/FormField.tsx`**

```tsx
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
```

- [ ] **Step 5: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0. (Nothing imports these components yet, so this only confirms they typecheck and bundle in isolation — `tsc -b` still checks every file in the project regardless of whether it's imported.)

- [ ] **Step 6: Commit**

```bash
git add admin/src/components/Button.tsx admin/src/components/Badge.tsx admin/src/components/StatCard.tsx admin/src/components/FormField.tsx
git commit -m "admin: add Button, Badge, StatCard, FormField components"
```

---

### Task 3: Layout — Sidebar + Topbar

**Files:**
- Modify: `admin/src/components/Layout.tsx` (full replacement — see below)

**Interfaces:**
- Consumes: `useAdminAuthStore((state) => state.logout)` and `useAdminAuthStore((state) => state.adminUser)` (existing, `admin/src/store/useAdminAuthStore.ts` — `adminUser: AdminUser | null` where `AdminUser.email: string`); `Button` (Task 2); CSS classes from Task 1 (`.sidebar-nav`, `.topbar`, `.topbar-account`, `.main-area`); `lucide-react` icon components (Task 1's dependency install).
- Produces: no new exports — `Layout` component's rendered structure (sidebar nav + topbar + `.content` outlet) is what Tasks 4–5's pages render inside of. No prop/type contract changes for downstream tasks.

- [ ] **Step 1: Replace `admin/src/components/Layout.tsx`**

```tsx
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Store, Megaphone, Newspaper, Users, Coffee, ScanLine, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { Button } from './Button';

const links = [
  { to: '/business', label: 'İşletme Bilgileri', icon: Store },
  { to: '/campaigns', label: 'Kampanyalar', icon: Megaphone },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/customers', label: 'Müşteriler', icon: Users },
  { to: '/products', label: 'Ürünler', icon: Coffee },
  { to: '/scan', label: 'QR Tarayıcı', icon: ScanLine },
];

const titlesByPath = Object.fromEntries(links.map((link) => [link.to, link.label]));

export function Layout() {
  const logout = useAdminAuthStore((state) => state.logout);
  const adminUser = useAdminAuthStore((state) => state.adminUser);
  const location = useLocation();
  const title = titlesByPath[location.pathname] ?? 'Laos Admin';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Laos Admin</h1>
        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <Button variant="ghost" onClick={logout}>
          <LogOut size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Çıkış Yap
        </Button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <h2>{title}</h2>
          {adminUser && <span className="topbar-account">{adminUser.email}</span>}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
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

Run from `admin/`:
```bash
npm run dev
```
Open the printed local URL, log in (`admin@lakiscoffee.com` / `admin1234`), and confirm: dark sidebar with 6 icon+label nav links, a logout button pinned to the bottom of the sidebar, and a topbar showing the current page's title on the left and the admin's email on the right. Navigate between all 6 pages and confirm the topbar title updates and the active nav link is highlighted in amber. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/Layout.tsx
git commit -m "admin: rewrite Layout as Sidebar + Topbar"
```

---

### Task 4: BusinessPage — stat cards + FormField/Button

**Files:**
- Modify: `admin/src/pages/BusinessPage.tsx` (full replacement — see below)

**Interfaces:**
- Consumes: `FormField` and `Button` (Task 2); `listCustomersRequest(): Promise<Customer[]>` (existing, `admin/src/api/customers.ts`); `getBusinessRequest`/`updateBusinessRequest` (existing, `admin/src/api/business.ts`, unchanged).
- Produces: no new exports.

- [ ] **Step 1: Replace `admin/src/pages/BusinessPage.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 3: Manual check**

Run from `admin/`:
```bash
npm run dev
```
Log in, open "İşletme Bilgileri". Confirm two stat cards appear above the form ("Hedef Fincan" showing the current threshold, "Kayıtlı Müşteri" showing the customer count — cross-check the count against the "Müşteriler" page). Edit a field, save, confirm "Kaydedildi" appears and the stat updates if you changed the threshold. Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/BusinessPage.tsx
git commit -m "admin: rework BusinessPage with stat cards and FormField/Button"
```

---

### Task 5: ProductsPage + ImageUploadField restyle

**Files:**
- Modify: `admin/src/pages/ProductsPage.tsx` (full replacement — see below)
- Modify: `admin/src/components/ImageUploadField.tsx` (full replacement — see below)

**Interfaces:**
- Consumes: `Button`, `Badge`, `FormField` (Task 2); existing `admin/src/api/products.ts` (`ProductInput`, `createProductRequest`, `updateProductRequest`, `deleteProductRequest`, `listProductsRequest` — unchanged); existing `resolveAssetUrl` (`admin/src/api/assetUrl.ts`, unchanged).
- Produces: no new exports. `ImageUploadField`'s props (`{ label: string; value?: string; onChange: (url: string) => void }`) are unchanged, so `CampaignsPage.tsx`/`BlogPage.tsx` (which also render it) keep working without modification.

- [ ] **Step 1: Replace `admin/src/components/ImageUploadField.tsx`**

```tsx
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { uploadImageRequest } from '../api/uploads';
import { getApiErrorMessage } from '../api/errorMessage';
import { resolveAssetUrl } from '../api/assetUrl';

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
    <label className="field">
      <span className="field-label">{label}</span>
      {value && (
        <img
          src={resolveAssetUrl(value) ?? undefined}
          alt=""
          style={{ maxWidth: 160, display: 'block', marginBottom: 8, borderRadius: 8 }}
        />
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Yükleniyor…</p>}
      {error && <p className="error-text">{error}</p>}
    </label>
  );
}
```

- [ ] **Step 2: Replace `admin/src/pages/ProductsPage.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify**

Run from `admin/`:
```bash
npx tsc -b && npm run build
```
Expected: both exit 0.

- [ ] **Step 4: Manual check**

Run from `admin/`:
```bash
npm run dev
```
Log in, open "Ürünler". Confirm: existing products list with thumbnails where set, a "Pasif" badge on inactive products and an "Ödül olarak verilemez" badge on non-redeemable ones. Create a new product (with an image upload), edit it, toggle its "Aktif"/"Puanla alınabilir" checkboxes and confirm the badges appear/disappear accordingly, then delete it. Also open "Kampanyalar" and "Blog" and confirm their image upload fields still render and work (regression check — `ImageUploadField` changed and is shared). Stop the dev server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add admin/src/pages/ProductsPage.tsx admin/src/components/ImageUploadField.tsx
git commit -m "admin: rework ProductsPage with Button/Badge/FormField, restyle ImageUploadField"
```

---

### Task 6: Push

- [ ] **Step 1: Push all commits**

```bash
git push origin master
```
Expected: exits 0, remote `master` now includes all 5 commits from Tasks 1–5.
