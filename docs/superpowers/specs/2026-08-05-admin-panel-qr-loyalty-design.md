# Admin Panel + QR Puan Sistemi — Tasarım

Durum: Onaylandı (2026-08-05)

## Amaç

İki bağımlı özelliği kapsar:

1. **Admin Panelli Web Sitesi** — işletme sahibinin işletme bilgilerini, kampanyaları,
   blog yazılarını yönettiği ve müşteri/puan durumunu görebildiği bir Vite tabanlı web
   uygulaması.
2. **QR ile Ürün Alma ve Puan Sistemi** — personelin müşterinin mobil uygulamadaki QR
   kodunu admin panelinden okutup ürün seçerek puan işlediği, eşik puana ulaşan
   müşteriye ücretsiz ürün verilebilen akış.

Eşik değeri (kaç puanda ücretsiz ürün) admin panelden ayarlanabilir olacak.

## Kapsam Dışı

- Müşteri (mobile) tarafında yeni ekran/değişiklik. Mobile'daki `QrCodeScreen.tsx`
  zaten `laos-clone:user:<id>` formatında gerçek QR üretiyor, buna dokunulmuyor.
- İşletme self-servis kaydı / admin hesabı self-servis kaydı. Admin hesapları
  bu aşamada yalnızca seed/DB üzerinden oluşturulacak.
- Şube (Branch) bazlı ayrıştırma. Product/Category/Campaign zaten `businessId`
  seviyesinde, QR akışı da şube ayrımı yapmadan işletme geneli çalışacak.
- Otomatik ödül düşümü. Eşik aşıldığında sistem sadece uyarır, düşüm personelin
  onayına bağlıdır.

## Veri Modeli Değişiklikleri

`server/prisma/schema.prisma` içine:

```prisma
model AdminUser {
  id           String   @id @default(uuid())
  businessId   String
  email        String   @unique
  passwordHash String
  fullName     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@map("admin_users")
}

model BlogPost {
  id            String    @id @default(uuid())
  businessId    String
  title         String
  slug          String
  content       String
  coverImageUrl String?
  isPublished   Boolean   @default(false)
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, slug])
  @@index([businessId])
  @@map("blog_posts")
}
```

`Business` modeline `adminUsers AdminUser[]` ve `blogPosts BlogPost[]` ters ilişki
alanları eklenecek. Mevcut `Business.loyaltyTargetCups` alanı puan eşiği olarak
doğrudan kullanılacak, yeni alan gerekmiyor.

Puan bakiyesi ayrı bir alanda tutulmayacak; `LoyaltyPointTransaction` üzerinden
`SUM(EARN) - SUM(REDEEM)` şeklinde anlık hesaplanacak (bu ölçekte denormalize
alan gereksiz karmaşıklık).

## Backend API

Tüm admin uçları `server/src/routes/admin/*` altında, `adminAuth` middleware'i
ile korunur. `adminAuth`, mevcut `middleware/auth.ts`'deki JWT doğrulama
mantığını kullanır ama `AdminUser` tablosuna karşı doğrular ve
`req.adminAuth = { adminUserId, businessId }` set eder — customer auth ile
karışmaması için ayrı bir middleware ve ayrı bir `AuthenticatedRequest` tipi.

### Auth
- `POST /api/admin/auth/login` — email/şifre, access+refresh token döner
  (mevcut customer auth'taki access/refresh JWT desenini tekrar kullanır,
  ayrı secret ile)
- `POST /api/admin/auth/refresh`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### İşletme
- `GET /api/admin/business` — giriş yapan adminin işletme bilgileri
- `PATCH /api/admin/business` — name, category, address, phone, email, logoUrl,
  workingHours, **loyaltyTargetCups**

### Kampanyalar
- `GET /api/admin/campaigns`
- `POST /api/admin/campaigns`
- `PATCH /api/admin/campaigns/:id`
- `DELETE /api/admin/campaigns/:id`

### Blog
- `GET /api/admin/blog-posts`
- `POST /api/admin/blog-posts`
- `PATCH /api/admin/blog-posts/:id`
- `DELETE /api/admin/blog-posts/:id`

### Müşteriler
- `GET /api/admin/customers` — işletmenin `User` kayıtları + her biri için
  hesaplanmış puan bakiyesi (`fullName`, `email`, `phone`, `pointsBalance`,
  `createdAt`)

### QR / Puan
- `POST /api/admin/loyalty/scan`
  - Body: `{ qrValue: string, productId: string }` (qrValue = mobile'daki
    `laos-clone:user:<id>` string'i, sunucu tarafında parse edilip
    `userId` çıkarılır ve o kullanıcının bu işletmeye ait olduğu doğrulanır)
  - İşlem: `LoyaltyPointTransaction(type=EARN, points=product.pointsReward)`
    oluşturur
  - Response: `{ pointsBalance, rewardEligible: boolean, threshold }`
- `POST /api/admin/loyalty/redeem`
  - Body: `{ userId: string }`
  - Ön koşul: `pointsBalance >= business.loyaltyTargetCups`, değilse 400
  - İşlem: `LoyaltyPointTransaction(type=REDEEM, points=loyaltyTargetCups,
    note='Ücretsiz ürün verildi')` oluşturur
  - Response: `{ pointsBalance }`

Zod ile tüm request body'leri doğrulanacak, mevcut `validators/` deseni takip
edilecek. Hatalar mevcut `AppError` + `errorHandler` altyapısıyla dönecek.

## Admin Frontend (`admin/`, Vite + React + TypeScript)

Yeni üst düzey klasör, `mobile/` ve `server/` ile aynı seviyede.

- **Stack:** Vite, React 18+, TypeScript, React Router, Axios (mevcut mobile'daki
  axios+interceptor desenine benzer bir API client), server state yönetimi
  için TanStack Query (React Query) — cache/invalidation'ı elle yönetmekten
  daha az kod gerektirir.
- **Ekranlar:**
  - `/login` — email/şifre formu
  - `/` (layout: sidebar + korumalı route'lar)
    - `/business` — işletme bilgileri formu (puan eşiği alanı dahil)
    - `/campaigns` — liste + ekle/düzenle/sil modal
    - `/blog` — liste + ekle/düzenle/sil (başlık, içerik, kapak görseli, yayın
      durumu)
    - `/customers` — tablo (ad, email, telefon, puan bakiyesi)
    - `/scan` — QR tarayıcı ekranı
- **QR tarama:** `html5-qrcode` kütüphanesi ile canlı kamera taraması; kamera
  erişimi yoksa/başarısızsa manuel QR metni giriş alanı fallback olarak
  sunulacak. Kod okunduğunda ürün seçim listesi (işletmenin `Product`'ları)
  açılır, seçilince `/api/admin/loyalty/scan` çağrılır. Response
  `rewardEligible: true` dönerse "Ücretsiz Ürün Ver" onay butonu gösterilir,
  onaylanırsa `/api/admin/loyalty/redeem` çağrılır.
- **Auth:** access token memory + refresh token'la sessiz yenileme (mevcut
  mobile deseni referans alınır), token yoksa `/login`'e yönlendirme.

## Hata Yönetimi

- QR parse edilemezse veya `laos-clone:user:` prefix'i yoksa: kullanıcıya
  "Geçersiz QR kodu" mesajı, backend'e istek atılmaz.
- Scan edilen `userId` farklı bir işletmeye aitse: backend 404 döner
  ("Bu işletmeye kayıtlı müşteri bulunamadı"), businessId çapraz kontrolü
  server tarafında yapılır (frontend'e güvenilmez).
- Redeem çağrısı eşik altındayken yapılırsa: backend 400 döner, frontend
  zaten UI'da butonu göstermeyerek bunu engeller ama server-side kontrol
  asıl güvenlik sınırı.

## Test Yaklaşımı

- Backend: Puan hesaplama (`SUM(EARN)-SUM(REDEEM)`) ve eşik kontrolü
  (`rewardEligible`, redeem ön koşulu) için birim testler — mevcut projede
  test altyapısı yok, Vitest eklenecek.
- Frontend: Otomatik test eklenmeyecek; dev server ile uçtan uca manuel
  doğrulama (login → işletme düzenle → kampanya/blog CRUD → QR tara → puan
  ekle → eşikte ödül ver akışı).

## Uygulama Sırası (plan aşamasında detaylandırılacak)

1. Prisma şema değişiklikleri (AdminUser, BlogPost) + migration
2. Admin auth (backend + service + middleware)
3. İşletme / Kampanya / Blog / Müşteri CRUD uçları
4. Puan/QR scan + redeem uçları + birim testler
5. `admin/` Vite iskeleti + routing + API client + auth akışı
6. İşletme / Kampanya / Blog / Müşteri ekranları
7. QR tarayıcı ekranı ve puan/ödül akışı
8. Uçtan uca manuel doğrulama
