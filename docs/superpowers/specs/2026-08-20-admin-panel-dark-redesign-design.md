# Admin Panel — Koyu Tema Yeniden Tasarımı (Pilot: Business + Products)

Durum: Onaylandı (2026-08-20)

## Amaç

Admin panel şu an düz HTML (`<div className="card">`, çıplak `<input>`/`<select>`/
`<button>`) ile yazılmış, hiçbir tasarım sistemi yok. Bu, panele "Karanlık &
Editoryal" kimlikli (koyu zemin, amber vurgular, yüksek kontrast), Sidebar +
Topbar yerleşimine sahip, yeniden kullanılabilir bileşenlerden oluşan bir görsel
sistem kazandırır ve bunu iki temsili sayfada (**Business**, **Products**)
uygular. Diğer sayfalar (Login, Campaigns, Blog, Customers, Scan) bu pilotta
değişmez; sistem onaylanınca aynı kalıpla hızlıca yayılır.

Görsel yön, kullanıcıyla brainstorming sırasında görsel companion üzerinden 3
mockup (Sıcak & Sade / Cesur Dashboard / Karanlık & Editoryal) ve 3 yerleşim
(Klasik Sidebar / Sidebar+Topbar / İkon Rayı) karşılaştırılarak seçildi:
**Karanlık & Editoryal** + **Sidebar + Topbar**.

## Kapsam Dışı

- Açık/koyu tema geçişi (toggle). Panel sadece koyu temada olacak — iki tema
  token seti ve bir switcher bu aşamada gereksiz karmaşıklık.
- Login, Campaigns, Blog, Customers, Scan sayfalarının yeniden tasarımı. Aynı
  token/bileşen sistemi kurulduktan sonra ayrı bir iterasyonda yapılacak.
- Tailwind/shadcn-ui geçişi. Pilot kapsamı 2 sayfa olduğu için mevcut düz CSS
  yapısı korunup CSS custom property tabanlı bir token sistemiyle
  genişletilecek; yeni bir build aracı/migrasyon maliyeti eklenmeyecek.
- Mobil uygulama tarafında herhangi bir değişiklik.
- Yeni bir "Dashboard/Ana Sayfa" route'u. Business sayfası istatistik
  kartlarını kendi içinde gösterecek, ayrı bir genel bakış sayfası açılmayacak.

## Görsel Kimlik (Design Tokens)

`admin/src/index.css` içine `:root` üzerinde CSS custom property'ler olarak
eklenecek:

```css
:root {
  color-scheme: dark;

  --color-bg: #171310;
  --color-sidebar: #0F0B08;
  --color-card: #211A15;
  --color-border: #322718;
  --color-accent: #D9A566;
  --color-text-primary: #EFE6DA;
  --color-text-secondary: #9A8878;
  --color-text-muted: #3A2E20;
  --color-danger: #E5484D;

  --radius: 10px;
  --radius-full: 999px;
}
```

`color-scheme: dark` is required alongside the palette — without it, native browser
controls (select dropdowns, checkboxes, file-input pickers, scrollbars) stay
light-themed regardless of the CSS. `--color-text-secondary` was revised from
the mockup's original `#6B5C4E` to `#9A8878` after the implementation's final
review found the original failed WCAG AA contrast (~2.5-2.9:1 against the
card/sidebar backgrounds it's used on for labels, stat labels, and inactive
nav links); `#9A8878` passes AA (~5.0-5.8:1) while keeping the same dark
identity.

Mevcut açık renkli kahve paleti (`#6B3E26` vb.) mobil uygulamada kalmaya devam
eder — admin panel artık kendi (koyu) kimliğini taşır, marka rengi olarak
amber (`--color-accent`) kullanılır.

## Teknik Yaklaşım

- Yeni bağımlılık: yalnızca `lucide-react` (ikonlar için — sidebar/topbar
  nav ikonları, badge/durum ikonları). Tailwind/shadcn eklenmiyor.
- Mevcut `index.css` genişletilecek: yukarıdaki token'lar + yeni bileşen
  sınıfları (`.btn`, `.btn-primary`, `.btn-ghost`, `.badge`, `.stat-card`,
  `.field` vb.), var olan `.card`/`.row-actions` gibi sınıflar token'lara
  bağlanacak şekilde güncellenecek.
- Yeni küçük React bileşenleri `admin/src/components/` altına eklenecek:
  `Button.tsx`, `Badge.tsx`, `StatCard.tsx`, `FormField.tsx`. Var olan sayfa
  yapısı (React Query + mutation deseni) değişmez, sadece JSX/markup ve
  className'ler bu bileşenlerle değiştirilir.

## Yerleşim: Sidebar + Topbar

`admin/src/components/Layout.tsx` yeniden yazılır:

- **Sidebar** (`--color-sidebar` zemin, sabit genişlik ~220px): üstte logo/
  işletme adı, altında `lucide-react` ikonlu nav linkleri (mevcut `links`
  dizisi ikonlarla genişletilir), en altta çıkış butonu.
- **Topbar** (sidebar'ın sağındaki içerik alanının üstünde, `--color-border`
  alt çizgi): sol tarafta o an aktif sayfanın başlığı — `useLocation()` ile
  okunan pathname, mevcut `links` dizisindeki `label` değerlerinden kurulan
  bir `pathname → title` eşlemesiyle bulunur (yeni bir context/prop akışı
  gerekmez) — sağ tarafta giriş yapan admin'in e-postası
  (`useAdminAuthStore`'dan).
- İçerik alanı (`main.content`) `--color-bg` zeminde, `max-width` korunur.

## Yeniden Kullanılabilir Bileşenler

| Bileşen | Kullanım |
| --- | --- |
| `Button` | `variant`: `primary` (amber dolgu), `ghost` (sadece kenarlık), `danger` (sil aksiyonları) |
| `Badge` | Durum etiketleri: "Aktif"/"Pasif", "Ödül olarak verilemez" |
| `StatCard` | Küçük sayısal özet kartı (etiket + büyük değer) |
| `FormField` | Label + input/textarea/select sarmalayıcı, tutarlı boşluk |

Var olan `ImageUploadField` bileşeni de yeni token'lara göre stil güncellemesi
alır (kendi mantığı değişmez).

## Pilot Sayfalar

### Business (`BusinessPage.tsx`)
- Üstte 2 `StatCard`: **Hedef Fincan** (`business.loyaltyTargetCups`, zaten
  yüklü veriden) ve **Kayıtlı Müşteri** (mevcut `listCustomersRequest`
  — `CustomersPage.tsx`'te zaten kullanılan uç — ile ayrıca çekilip
  `.length` sayılır; yeni bir backend ucu eklenmez). Şube sayısı gibi admin
  API'sinde karşılığı olmayan istatistikler eklenmeyecek.
- Altta işletme bilgileri formu, `FormField`/`Button` ile yeniden düzenlenmiş,
  aynı alanlar (name, category, address, phone, email, workingHours,
  loyaltyTargetCups).

### Products (`ProductsPage.tsx`)
- Form aynı alanlar, `FormField`/`Button`/`ImageUploadField` ile.
- Liste: her ürün kartında küçük görsel thumbnail, `Badge` ile "Pasif" /
  "Ödül olarak verilemez" durumları, `Button variant="ghost"` düzenle,
  `Button variant="danger"` sil.

## Hata Yönetimi

Değişmiyor — mevcut `error-text` sınıfı `--color-danger` token'ına bağlanır,
davranış (mutation `onError` → `setError`) aynen korunur.

## Test Yaklaşımı

- `npx tsc -b` ile typecheck (mevcut CI/dev akışı).
- Otomatik görsel/e2e test eklenmeyecek (mevcut projede admin için de yok);
  dev server ile manuel gözle kontrol — Business ve Products sayfalarının
  login → görüntüleme → CRUD akışı.

## Uygulama Sırası

1. `lucide-react` kurulumu, `index.css`'e token'lar + yeni bileşen sınıfları
2. `Button`, `Badge`, `StatCard`, `FormField` bileşenleri
3. `Layout.tsx` → Sidebar + Topbar
4. `BusinessPage.tsx` yeniden düzenleme
5. `ProductsPage.tsx` yeniden düzenleme
6. Typecheck + dev server üzerinde manuel gözle kontrol
