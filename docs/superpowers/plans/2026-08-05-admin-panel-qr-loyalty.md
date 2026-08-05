# Admin Panel + QR Puan Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İşletme sahibinin işletme bilgilerini/kampanyalarını/blog yazılarını/müşterilerini yönettiği bir Vite admin paneli ve personelin müşteri QR'ını okutarak puan işlediği/ödül verdiği bir arka uç eklemek.

**Architecture:** Mevcut `server/` Express+Prisma API'sine `/api/admin/*` namespace'i (ayrı `AdminUser` modeli + ayrı JWT secret'lı `authenticateAdmin` middleware) eklenir. Yeni `admin/` klasöründe Vite+React+TS bir SPA bu API'yi tüketir. Puan bakiyesi denormalize edilmez, `LoyaltyPointTransaction` üzerinden anlık hesaplanır.

**Tech Stack:** Express 5, Prisma 7, Zod, JWT (backend, mevcut); Vite, React 18, TypeScript, React Router, TanStack Query, Axios, Zustand, html5-qrcode (yeni admin frontend); Vitest (yeni backend birim testleri).

## Global Constraints

- Tüm yeni backend kod, mevcut `server/src/{routes,controllers,services,validators,middleware}` düz dosya adlandırma deseniyle uyumlu olacak (`adminX.routes.ts` vb.), yeni alt klasör açılmayacak.
- Admin hesapları yalnızca seed script üzerinden oluşturulur, self-servis kayıt ekranı yok.
- QR değeri formatı `laos-clone:user:<id>` sabit kabul edilir, mobile tarafı değiştirilmeyecek.
- Puan bakiyesi hiçbir yerde ayrı bir sütunda tutulmayacak, her seferinde `SUM(EARN) - SUM(REDEEM)` ile hesaplanacak.
- Ödül eşiği `Business.loyaltyTargetCups` alanından okunur, yeni alan eklenmeyecek.
- Her görev sonunda ilgili değişiklikler commit'lenecek (feature branch: `feature/admin-panel-qr-loyalty`, zaten checkout edilmiş durumda).
- Hiçbir commit `--no-verify` ile atılmayacak.

---

## Task 1: Prisma şeması — AdminUser ve BlogPost modelleri

**Files:**
- Modify: `server/prisma/schema.prisma`

**Interfaces:**
- Produces: `AdminUser { id, businessId, email, passwordHash, fullName, createdAt, updatedAt }`, `BlogPost { id, businessId, title, slug, content, coverImageUrl, isPublished, publishedAt, createdAt, updatedAt }` Prisma modelleri ve `PrismaClient` üzerinden `prisma.adminUser` / `prisma.blogPost` erişimi. Sonraki tüm backend görevleri bu tipleri kullanır.

- [ ] **Step 1: `Business` modeline ters ilişki alanlarını ekle**

`server/prisma/schema.prisma` içinde `model Business { ... }` bloğunda `campaigns  Campaign[]` satırının hemen altına ekle:

```prisma
  campaigns  Campaign[]
  adminUsers AdminUser[]
  blogPosts  BlogPost[]
```

- [ ] **Step 2: `AdminUser` ve `BlogPost` modellerini `Campaign` modelinin altına ekle**

`model Campaign { ... }` bloğunun kapanışından (`}`) hemen sonra, dosyanın sonuna ekle:

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

- [ ] **Step 3: Migration oluştur ve çalıştır**

`server/` dizininde:

```bash
npm run prisma:migrate -- --name add_admin_user_and_blog_post
```

Beklenen: komut yeni bir `server/prisma/migrations/<timestamp>_add_admin_user_and_blog_post/` klasörü oluşturur, migration'ı yerel Postgres'e uygular ve `Your database is now in sync with your schema` benzeri bir mesajla biter. `server/src/generated/prisma` içindeki client otomatik yeniden üretilir (migrate dev bunu otomatik yapar).

Not: Bu adım çalışan bir Postgres gerektirir (`docker compose up -d` repo kökünde daha önce çalıştırılmış olmalı).

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "AdminUser ve BlogPost modellerini ekle"
```

---

## Task 2: Admin JWT secret'ları ve token yardımcı fonksiyonları

**Files:**
- Modify: `server/src/config/env.ts`
- Modify: `server/.env.example`
- Modify: `server/.env` (yerel geliştirme için, commit edilmez)
- Modify: `server/src/utils/jwt.ts`

**Interfaces:**
- Produces: `AdminTokenPayload { adminUserId: string; businessId: string }`, `signAdminAccessToken(payload): string`, `signAdminRefreshToken(payload): string`, `verifyAdminAccessToken(token): AdminTokenPayload`, `verifyAdminRefreshToken(token): AdminTokenPayload` — Task 3 ve Task 5 bunları kullanır.

- [ ] **Step 1: `env.ts`'ye admin secret alanlarını ekle**

`server/src/config/env.ts` içinde `export const env = { ... }` bloğunu şu hale getir:

```ts
export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  // Saniye cinsinden
  jwtAccessExpiresInSeconds: Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900),
  jwtRefreshExpiresInSeconds: Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 2592000),
  adminJwtAccessSecret: required('ADMIN_JWT_ACCESS_SECRET'),
  adminJwtRefreshSecret: required('ADMIN_JWT_REFRESH_SECRET'),
};
```

- [ ] **Step 2: `.env.example`'a admin secret'larını ekle**

`server/.env.example` dosyasının sonuna ekle:

```
ADMIN_JWT_ACCESS_SECRET="change-me-admin"
ADMIN_JWT_REFRESH_SECRET="change-me-admin"
```

- [ ] **Step 3: Yerel `.env` dosyasına da ekle**

`server/.env` dosyasının sonuna ekle (bu dosya `.gitignore`'da, commit edilmeyecek):

```
ADMIN_JWT_ACCESS_SECRET="dev-admin-access-secret"
ADMIN_JWT_REFRESH_SECRET="dev-admin-refresh-secret"
```

- [ ] **Step 4: `jwt.ts`'ye admin token fonksiyonlarını ekle**

`server/src/utils/jwt.ts` dosyasının sonuna ekle:

```ts
export interface AdminTokenPayload {
  adminUserId: string;
  businessId: string;
}

export function signAdminAccessToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.adminJwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresInSeconds,
  });
}

export function signAdminRefreshToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.adminJwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresInSeconds,
  });
}

export function verifyAdminAccessToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtAccessSecret) as AdminTokenPayload;
}

export function verifyAdminRefreshToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtRefreshSecret) as AdminTokenPayload;
}
```

- [ ] **Step 5: Derlemenin bozulmadığını doğrula**

```bash
cd server && npx tsc --noEmit
```

Beklenen: hatasız biter.

- [ ] **Step 6: Commit**

```bash
git add server/src/config/env.ts server/.env.example server/src/utils/jwt.ts
git commit -m "Admin JWT secret'larını ve token yardımcı fonksiyonlarını ekle"
```

---

## Task 3: Admin auth middleware

**Files:**
- Create: `server/src/middleware/adminAuth.ts`

**Interfaces:**
- Consumes: `verifyAdminAccessToken(token): AdminTokenPayload` (Task 2), `AppError` (`server/src/utils/AppError.ts`)
- Produces: `AdminAuthenticatedRequest` tipi, `authenticateAdmin(req, res, next)` middleware — `req.adminAuth = { adminUserId, businessId }` set eder. Task 5+ tüm korumalı admin route'larında kullanır.

- [ ] **Step 1: Middleware dosyasını oluştur**

`server/src/middleware/adminAuth.ts`:

```ts
import { NextFunction, Request, Response } from 'express';
import { verifyAdminAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export interface AdminAuthenticatedRequest extends Request {
  adminAuth?: {
    adminUserId: string;
    businessId: string;
  };
}

export function authenticateAdmin(req: AdminAuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'Yetkilendirme başlığı eksik'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAdminAccessToken(token);
    req.adminAuth = { adminUserId: payload.adminUserId, businessId: payload.businessId };
    next();
  } catch {
    next(new AppError(401, 'Geçersiz veya süresi dolmuş token'));
  }
}
```

- [ ] **Step 2: Derlemenin bozulmadığını doğrula**

```bash
cd server && npx tsc --noEmit
```

Beklenen: hatasız biter.

- [ ] **Step 3: Commit**

```bash
git add server/src/middleware/adminAuth.ts
git commit -m "Admin auth middleware ekle"
```

---

## Task 4: Puan hesaplama çekirdek fonksiyonları (TDD) + Vitest kurulumu

**Files:**
- Create: `server/src/services/loyaltyCalc.ts`
- Create: `server/src/services/loyaltyCalc.test.ts`
- Create: `server/vitest.config.ts`
- Modify: `server/package.json`

**Interfaces:**
- Consumes: `AppError` (`server/src/utils/AppError.ts`)
- Produces: `getPointsBalance(earnSum: number, redeemSum: number): number`, `isRewardEligible(pointsBalance: number, threshold: number): boolean`, `computeRedeemBalance(pointsBalance: number, threshold: number): number` (eşik altındaysa `AppError(400, ...)` fırlatır), `parseUserIdFromQrValue(qrValue: string): string` (geçersiz formatta `AppError(400, ...)` fırlatır). Task 9 ve Task 11 bu fonksiyonları kullanır.

- [ ] **Step 1: Vitest'i devDependency olarak ekle ve test script'ini güncelle**

`server/package.json` içinde `"test": "echo \"Error: no test specified\" && exit 1"` satırını değiştir:

```json
    "test": "vitest run",
```

`"devDependencies"` bloğuna ekle:

```json
    "vitest": "^3.0.0",
```

Sonra:

```bash
cd server && npm install
```

- [ ] **Step 2: Vitest config dosyasını oluştur**

`server/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Önce başarısız olacak testleri yaz**

`server/src/services/loyaltyCalc.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/AppError';
import {
  computeRedeemBalance,
  getPointsBalance,
  isRewardEligible,
  parseUserIdFromQrValue,
} from './loyaltyCalc';

describe('getPointsBalance', () => {
  it('earn ve redeem toplamlarının farkını döner', () => {
    expect(getPointsBalance(10, 4)).toBe(6);
  });

  it('hiç işlem yoksa 0 döner', () => {
    expect(getPointsBalance(0, 0)).toBe(0);
  });
});

describe('isRewardEligible', () => {
  it('bakiye eşiğe eşitse true döner', () => {
    expect(isRewardEligible(6, 6)).toBe(true);
  });

  it('bakiye eşiğin üstündeyse true döner', () => {
    expect(isRewardEligible(8, 6)).toBe(true);
  });

  it('bakiye eşiğin altındaysa false döner', () => {
    expect(isRewardEligible(5, 6)).toBe(false);
  });
});

describe('computeRedeemBalance', () => {
  it('eşik kadar puanı düşer', () => {
    expect(computeRedeemBalance(8, 6)).toBe(2);
  });

  it('bakiye tam eşitse sıfıra düşer', () => {
    expect(computeRedeemBalance(6, 6)).toBe(0);
  });

  it('bakiye eşiğin altındaysa AppError fırlatır', () => {
    expect(() => computeRedeemBalance(5, 6)).toThrow(AppError);
  });
});

describe('parseUserIdFromQrValue', () => {
  it('geçerli formattan userId çıkarır', () => {
    expect(parseUserIdFromQrValue('laos-clone:user:abc-123')).toBe('abc-123');
  });

  it('yanlış prefix\'te AppError fırlatır', () => {
    expect(() => parseUserIdFromQrValue('baska-format:abc-123')).toThrow(AppError);
  });

  it('userId boşsa AppError fırlatır', () => {
    expect(() => parseUserIdFromQrValue('laos-clone:user:')).toThrow(AppError);
  });
});
```

- [ ] **Step 4: Testleri çalıştırıp başarısız olduğunu doğrula**

```bash
cd server && npm test
```

Beklenen: `Cannot find module './loyaltyCalc'` veya benzeri bir modül bulunamadı hatasıyla FAIL.

- [ ] **Step 5: `loyaltyCalc.ts`'yi yaz**

`server/src/services/loyaltyCalc.ts`:

```ts
import { AppError } from '../utils/AppError';

const QR_USER_PREFIX = 'laos-clone:user:';

export function getPointsBalance(earnSum: number, redeemSum: number): number {
  return earnSum - redeemSum;
}

export function isRewardEligible(pointsBalance: number, threshold: number): boolean {
  return pointsBalance >= threshold;
}

export function computeRedeemBalance(pointsBalance: number, threshold: number): number {
  if (pointsBalance < threshold) {
    throw new AppError(400, 'Puan bakiyesi ödül eşiğini karşılamıyor');
  }
  return pointsBalance - threshold;
}

export function parseUserIdFromQrValue(qrValue: string): string {
  if (!qrValue.startsWith(QR_USER_PREFIX)) {
    throw new AppError(400, 'Geçersiz QR kodu');
  }
  const userId = qrValue.slice(QR_USER_PREFIX.length).trim();
  if (!userId) {
    throw new AppError(400, 'Geçersiz QR kodu');
  }
  return userId;
}
```

- [ ] **Step 6: Testleri tekrar çalıştır ve geçtiğini doğrula**

```bash
cd server && npm test
```

Beklenen: 9 test de PASS.

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/package-lock.json server/vitest.config.ts server/src/services/loyaltyCalc.ts server/src/services/loyaltyCalc.test.ts
git commit -m "Puan hesaplama çekirdek fonksiyonlarını ve Vitest kurulumunu ekle"
```

---

## Task 5: Admin auth uçları + seed admin hesabı + admin router iskeleti

**Files:**
- Create: `server/src/validators/adminAuth.validators.ts`
- Create: `server/src/services/adminAuth.service.ts`
- Create: `server/src/controllers/adminAuth.controller.ts`
- Create: `server/src/routes/adminAuth.routes.ts`
- Create: `server/src/routes/admin.routes.ts`
- Modify: `server/src/app.ts`
- Modify: `server/prisma/seed.ts`

**Interfaces:**
- Consumes: `authenticateAdmin` (Task 3), `signAdminAccessToken`/`signAdminRefreshToken`/`verifyAdminRefreshToken` (Task 2), `prisma.adminUser` (Task 1)
- Produces: `adminRouter` (Express `Router`) — `app.use('/api/admin', adminRouter)` altında mount edilir. Task 6-11, `admin.routes.ts` içine kendi `adminRouter.use('/<path>', xRouter)` satırlarını ekleyerek genişletir.

- [ ] **Step 1: Validator'ları yaz**

`server/src/validators/adminAuth.validators.ts`:

```ts
import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export const adminRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken gerekli'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
```

- [ ] **Step 2: Service'i yaz**

`server/src/services/adminAuth.service.ts`:

```ts
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  signAdminAccessToken,
  signAdminRefreshToken,
  verifyAdminRefreshToken,
} from '../utils/jwt';
import type { AdminUser } from '../generated/prisma/client';
import type { AdminLoginInput } from '../validators/adminAuth.validators';

function toAdminAuthUser(adminUser: AdminUser) {
  const { passwordHash, ...rest } = adminUser;
  return rest;
}

export async function loginAdmin(input: AdminLoginInput) {
  const adminUser = await prisma.adminUser.findUnique({ where: { email: input.email } });
  if (!adminUser) {
    throw new AppError(401, 'E-posta veya şifre hatalı');
  }

  const passwordMatches = await bcrypt.compare(input.password, adminUser.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'E-posta veya şifre hatalı');
  }

  const tokens = {
    accessToken: signAdminAccessToken({ adminUserId: adminUser.id, businessId: adminUser.businessId }),
    refreshToken: signAdminRefreshToken({ adminUserId: adminUser.id, businessId: adminUser.businessId }),
  };

  return { adminUser: toAdminAuthUser(adminUser), tokens };
}

export async function refreshAdminAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyAdminRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Geçersiz veya süresi dolmuş refresh token');
  }

  const adminUser = await prisma.adminUser.findUnique({ where: { id: payload.adminUserId } });
  if (!adminUser) {
    throw new AppError(401, 'Kullanıcı bulunamadı');
  }

  const accessToken = signAdminAccessToken({
    adminUserId: adminUser.id,
    businessId: adminUser.businessId,
  });
  return { accessToken };
}

export async function getCurrentAdmin(adminUserId: string) {
  const adminUser = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!adminUser) {
    throw new AppError(404, 'Kullanıcı bulunamadı');
  }
  return toAdminAuthUser(adminUser);
}
```

- [ ] **Step 3: Controller'ı yaz**

`server/src/controllers/adminAuth.controller.ts`:

```ts
import { NextFunction, Request, Response } from 'express';
import { adminLoginSchema, adminRefreshSchema } from '../validators/adminAuth.validators';
import * as adminAuthService from '../services/adminAuth.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminLoginSchema.parse(req.body);
    const result = await adminAuthService.loginAdmin(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = adminRefreshSchema.parse(req.body);
    const result = await adminAuthService.refreshAdminAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response) {
  res.status(204).send();
}

export async function me(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const adminUser = await adminAuthService.getCurrentAdmin(req.adminAuth!.adminUserId);
    res.status(200).json({ adminUser });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Route'ları yaz**

`server/src/routes/adminAuth.routes.ts`:

```ts
import { Router } from 'express';
import * as adminAuthController from '../controllers/adminAuth.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', adminAuthController.login);
adminAuthRouter.post('/refresh', adminAuthController.refresh);
adminAuthRouter.post('/logout', adminAuthController.logout);
adminAuthRouter.get('/me', authenticateAdmin, adminAuthController.me);
```

- [ ] **Step 5: Admin router iskeletini oluştur**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
```

- [ ] **Step 6: `app.ts`'ye admin router'ı mount et**

`server/src/app.ts` dosyasını şu hale getir:

```ts
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);
```

- [ ] **Step 7: Seed script'ine admin hesabı ekle**

`server/prisma/seed.ts` başına `bcrypt` import'u ekle:

```ts
import bcrypt from 'bcrypt';
```

`const business = await prisma.business.upsert({...})` bloğunun hemen altına ekle:

```ts
  const adminPasswordHash = await bcrypt.hash('admin1234', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@lakiscoffee.com' },
    update: {},
    create: {
      id: 'seed-admin-lakis-coffee',
      businessId: business.id,
      email: 'admin@lakiscoffee.com',
      passwordHash: adminPasswordHash,
      fullName: 'Lakis Coffee Admin',
    },
  });
```

- [ ] **Step 8: Migration ve seed'i çalıştır, derlemeyi doğrula**

```bash
cd server
npx tsc --noEmit
npm run prisma:seed
```

Beklenen: `tsc` hatasız biter, seed komutu `Seed tamamlandı: Lakis Coffee` yazdırır.

- [ ] **Step 9: Uçtan uca doğrula**

```bash
npm run dev
```

Ayrı bir terminalde:

```bash
curl -s -X POST http://localhost:4000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lakiscoffee.com","password":"admin1234"}'
```

Beklenen: `200` ve `{"adminUser": {...}, "tokens": {"accessToken": "...", "refreshToken": "..."}}` içeren bir JSON. Dönen `accessToken` ile:

```bash
curl -s http://localhost:4000/api/admin/auth/me -H "Authorization: Bearer <accessToken>"
```

Beklenen: `200` ve `{"adminUser": {...}}`. Dev server'ı durdur (Ctrl+C).

- [ ] **Step 10: Commit**

```bash
git add server/src/validators/adminAuth.validators.ts server/src/services/adminAuth.service.ts server/src/controllers/adminAuth.controller.ts server/src/routes/adminAuth.routes.ts server/src/routes/admin.routes.ts server/src/app.ts server/prisma/seed.ts
git commit -m "Admin auth uçlarını ve seed admin hesabını ekle"
```

---

## Task 6: İşletme bilgileri uçları

**Files:**
- Create: `server/src/validators/adminBusiness.validators.ts`
- Create: `server/src/services/adminBusiness.service.ts`
- Create: `server/src/controllers/adminBusiness.controller.ts`
- Create: `server/src/routes/adminBusiness.routes.ts`
- Modify: `server/src/routes/admin.routes.ts`

**Interfaces:**
- Consumes: `authenticateAdmin`, `AdminAuthenticatedRequest` (Task 3), `prisma.business` (mevcut)
- Produces: `GET/PATCH /api/admin/business`

- [ ] **Step 1: Validator'ı yaz**

`server/src/validators/adminBusiness.validators.ts`:

```ts
import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'İşletme adı gerekli').optional(),
  category: z.string().min(1, 'Kategori gerekli').optional(),
  address: z.string().min(1, 'Adres gerekli').optional(),
  phone: z.string().min(1, 'Telefon gerekli').optional(),
  email: z.string().email('Geçerli bir e-posta adresi girin').optional(),
  logoUrl: z.string().url('Geçerli bir URL girin').nullable().optional(),
  workingHours: z.record(z.string(), z.string()).optional(),
  loyaltyTargetCups: z.number().int().positive('Eşik en az 1 olmalı').optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
```

- [ ] **Step 2: Service'i yaz**

`server/src/services/adminBusiness.service.ts`:

```ts
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { UpdateBusinessInput } from '../validators/adminBusiness.validators';

export async function getBusiness(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new AppError(404, 'İşletme bulunamadı');
  }
  return business;
}

export async function updateBusiness(businessId: string, input: UpdateBusinessInput) {
  await getBusiness(businessId);
  return prisma.business.update({ where: { id: businessId }, data: input });
}
```

- [ ] **Step 3: Controller'ı yaz**

`server/src/controllers/adminBusiness.controller.ts`:

```ts
import { NextFunction, Response } from 'express';
import { updateBusinessSchema } from '../validators/adminBusiness.validators';
import * as adminBusinessService from '../services/adminBusiness.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function getBusiness(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const business = await adminBusinessService.getBusiness(req.adminAuth!.businessId);
    res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}

export async function updateBusiness(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateBusinessSchema.parse(req.body);
    const business = await adminBusinessService.updateBusiness(req.adminAuth!.businessId, input);
    res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Route'ları yaz**

`server/src/routes/adminBusiness.routes.ts`:

```ts
import { Router } from 'express';
import * as adminBusinessController from '../controllers/adminBusiness.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminBusinessRouter = Router();

adminBusinessRouter.use(authenticateAdmin);
adminBusinessRouter.get('/', adminBusinessController.getBusiness);
adminBusinessRouter.patch('/', adminBusinessController.updateBusiness);
```

- [ ] **Step 5: `admin.routes.ts`'ye mount et**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
```

- [ ] **Step 6: Uçtan uca doğrula**

```bash
cd server && npx tsc --noEmit && npm run dev
```

Ayrı terminalde (önce Task 5 Step 9'daki gibi login olup `accessToken` al):

```bash
curl -s http://localhost:4000/api/admin/business -H "Authorization: Bearer <accessToken>"
curl -s -X PATCH http://localhost:4000/api/admin/business \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"loyaltyTargetCups": 8}'
```

Beklenen: ilk çağrı `200` ve `Lakis Coffee` işletmesini döner; ikinci çağrı `200` ve güncellenmiş `loyaltyTargetCups: 8` içeren işletmeyi döner. Dev server'ı durdur.

- [ ] **Step 7: Commit**

```bash
git add server/src/validators/adminBusiness.validators.ts server/src/services/adminBusiness.service.ts server/src/controllers/adminBusiness.controller.ts server/src/routes/adminBusiness.routes.ts server/src/routes/admin.routes.ts
git commit -m "Admin işletme bilgileri uçlarını ekle"
```

---

## Task 7: Kampanya CRUD uçları

**Files:**
- Create: `server/src/validators/adminCampaigns.validators.ts`
- Create: `server/src/services/adminCampaigns.service.ts`
- Create: `server/src/controllers/adminCampaigns.controller.ts`
- Create: `server/src/routes/adminCampaigns.routes.ts`
- Modify: `server/src/routes/admin.routes.ts`

**Interfaces:**
- Consumes: `authenticateAdmin`, `AdminAuthenticatedRequest` (Task 3), `prisma.campaign` (mevcut)
- Produces: `GET/POST /api/admin/campaigns`, `PATCH/DELETE /api/admin/campaigns/:id`

- [ ] **Step 1: Validator'ı yaz**

`server/src/validators/adminCampaigns.validators.ts`:

```ts
import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  imageUrl: z.string().url('Geçerli bir URL girin').optional(),
  startDate: z.string().min(1, 'Başlangıç tarihi gerekli'),
  endDate: z.string().min(1, 'Bitiş tarihi gerekli'),
  isActive: z.boolean().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
```

- [ ] **Step 2: Service'i yaz**

`server/src/services/adminCampaigns.service.ts`:

```ts
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { CreateCampaignInput, UpdateCampaignInput } from '../validators/adminCampaigns.validators';

export async function listCampaigns(businessId: string) {
  return prisma.campaign.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function createCampaign(businessId: string, input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive ?? true,
    },
  });
}

async function requireOwnedCampaign(businessId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, businessId } });
  if (!campaign) {
    throw new AppError(404, 'Kampanya bulunamadı');
  }
  return campaign;
}

export async function updateCampaign(businessId: string, campaignId: string, input: UpdateCampaignInput) {
  await requireOwnedCampaign(businessId, campaignId);
  return prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });
}

export async function deleteCampaign(businessId: string, campaignId: string) {
  await requireOwnedCampaign(businessId, campaignId);
  await prisma.campaign.delete({ where: { id: campaignId } });
}
```

- [ ] **Step 3: Controller'ı yaz**

`server/src/controllers/adminCampaigns.controller.ts`:

```ts
import { NextFunction, Response } from 'express';
import { createCampaignSchema, updateCampaignSchema } from '../validators/adminCampaigns.validators';
import * as adminCampaignsService from '../services/adminCampaigns.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaigns = await adminCampaignsService.listCampaigns(req.adminAuth!.businessId);
    res.status(200).json({ campaigns });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createCampaignSchema.parse(req.body);
    const campaign = await adminCampaignsService.createCampaign(req.adminAuth!.businessId, input);
    res.status(201).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateCampaignSchema.parse(req.body);
    const campaign = await adminCampaignsService.updateCampaign(
      req.adminAuth!.businessId,
      req.params.id,
      input,
    );
    res.status(200).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminCampaignsService.deleteCampaign(req.adminAuth!.businessId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Route'ları yaz**

`server/src/routes/adminCampaigns.routes.ts`:

```ts
import { Router } from 'express';
import * as adminCampaignsController from '../controllers/adminCampaigns.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminCampaignsRouter = Router();

adminCampaignsRouter.use(authenticateAdmin);
adminCampaignsRouter.get('/', adminCampaignsController.list);
adminCampaignsRouter.post('/', adminCampaignsController.create);
adminCampaignsRouter.patch('/:id', adminCampaignsController.update);
adminCampaignsRouter.delete('/:id', adminCampaignsController.remove);
```

- [ ] **Step 5: `admin.routes.ts`'ye mount et**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
```

- [ ] **Step 6: Uçtan uca doğrula**

```bash
cd server && npx tsc --noEmit && npm run dev
```

```bash
curl -s -X POST http://localhost:4000/api/admin/campaigns \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"title":"6 Kahvede 1 Hediye","description":"Test","startDate":"2026-08-01","endDate":"2026-09-01"}'
curl -s http://localhost:4000/api/admin/campaigns -H "Authorization: Bearer <accessToken>"
```

Beklenen: `POST` `201` ve oluşturulan kampanyayı döner; `GET` `200` ve listede bu kampanyayı içerir. Dev server'ı durdur.

- [ ] **Step 7: Commit**

```bash
git add server/src/validators/adminCampaigns.validators.ts server/src/services/adminCampaigns.service.ts server/src/controllers/adminCampaigns.controller.ts server/src/routes/adminCampaigns.routes.ts server/src/routes/admin.routes.ts
git commit -m "Admin kampanya CRUD uçlarını ekle"
```

---

## Task 8: Blog yazısı CRUD uçları

**Files:**
- Create: `server/src/validators/adminBlogPosts.validators.ts`
- Create: `server/src/services/adminBlogPosts.service.ts`
- Create: `server/src/controllers/adminBlogPosts.controller.ts`
- Create: `server/src/routes/adminBlogPosts.routes.ts`
- Modify: `server/src/routes/admin.routes.ts`

**Interfaces:**
- Consumes: `authenticateAdmin`, `AdminAuthenticatedRequest` (Task 3), `prisma.blogPost` (Task 1)
- Produces: `GET/POST /api/admin/blog-posts`, `PATCH/DELETE /api/admin/blog-posts/:id`

- [ ] **Step 1: Validator'ı yaz**

`server/src/validators/adminBlogPosts.validators.ts`:

```ts
import { z } from 'zod';

export const createBlogPostSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalı'),
  content: z.string().min(1, 'İçerik gerekli'),
  coverImageUrl: z.string().url('Geçerli bir URL girin').optional(),
  isPublished: z.boolean().optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
```

- [ ] **Step 2: Service'i yaz**

`server/src/services/adminBlogPosts.service.ts`:

```ts
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { CreateBlogPostInput, UpdateBlogPostInput } from '../validators/adminBlogPosts.validators';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

async function generateUniqueSlug(businessId: string, title: string): Promise<string> {
  const base = slugify(title) || 'yazi';
  let slug = base;
  let counter = 2;
  while (await prisma.blogPost.findUnique({ where: { businessId_slug: { businessId, slug } } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function listBlogPosts(businessId: string) {
  return prisma.blogPost.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function createBlogPost(businessId: string, input: CreateBlogPostInput) {
  const slug = await generateUniqueSlug(businessId, input.title);
  const isPublished = input.isPublished ?? false;
  return prisma.blogPost.create({
    data: {
      businessId,
      title: input.title,
      slug,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });
}

async function requireOwnedBlogPost(businessId: string, postId: string) {
  const post = await prisma.blogPost.findFirst({ where: { id: postId, businessId } });
  if (!post) {
    throw new AppError(404, 'Blog yazısı bulunamadı');
  }
  return post;
}

export async function updateBlogPost(businessId: string, postId: string, input: UpdateBlogPostInput) {
  const existing = await requireOwnedBlogPost(businessId, postId);
  const willPublishNow = input.isPublished === true && !existing.isPublished;
  return prisma.blogPost.update({
    where: { id: postId },
    data: {
      ...input,
      publishedAt: willPublishNow ? new Date() : undefined,
    },
  });
}

export async function deleteBlogPost(businessId: string, postId: string) {
  await requireOwnedBlogPost(businessId, postId);
  await prisma.blogPost.delete({ where: { id: postId } });
}
```

- [ ] **Step 3: Controller'ı yaz**

`server/src/controllers/adminBlogPosts.controller.ts`:

```ts
import { NextFunction, Response } from 'express';
import { createBlogPostSchema, updateBlogPostSchema } from '../validators/adminBlogPosts.validators';
import * as adminBlogPostsService from '../services/adminBlogPosts.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const posts = await adminBlogPostsService.listBlogPosts(req.adminAuth!.businessId);
    res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createBlogPostSchema.parse(req.body);
    const post = await adminBlogPostsService.createBlogPost(req.adminAuth!.businessId, input);
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateBlogPostSchema.parse(req.body);
    const post = await adminBlogPostsService.updateBlogPost(
      req.adminAuth!.businessId,
      req.params.id,
      input,
    );
    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminBlogPostsService.deleteBlogPost(req.adminAuth!.businessId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Route'ları yaz**

`server/src/routes/adminBlogPosts.routes.ts`:

```ts
import { Router } from 'express';
import * as adminBlogPostsController from '../controllers/adminBlogPosts.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminBlogPostsRouter = Router();

adminBlogPostsRouter.use(authenticateAdmin);
adminBlogPostsRouter.get('/', adminBlogPostsController.list);
adminBlogPostsRouter.post('/', adminBlogPostsController.create);
adminBlogPostsRouter.patch('/:id', adminBlogPostsController.update);
adminBlogPostsRouter.delete('/:id', adminBlogPostsController.remove);
```

- [ ] **Step 5: `admin.routes.ts`'ye mount et**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';
import { adminBlogPostsRouter } from './adminBlogPosts.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
adminRouter.use('/blog-posts', adminBlogPostsRouter);
```

- [ ] **Step 6: Uçtan uca doğrula**

```bash
cd server && npx tsc --noEmit && npm run dev
```

```bash
curl -s -X POST http://localhost:4000/api/admin/blog-posts \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"title":"Kahve Çekirdeği Rehberi","content":"Doğru demleme...","isPublished":true}'
curl -s http://localhost:4000/api/admin/blog-posts -H "Authorization: Bearer <accessToken>"
```

Beklenen: `POST` `201`, dönen nesnede `slug: "kahve-cekirdegi-rehberi"` ve dolu bir `publishedAt`; `GET` `200` ve listede bu yazıyı içerir. Dev server'ı durdur.

- [ ] **Step 7: Commit**

```bash
git add server/src/validators/adminBlogPosts.validators.ts server/src/services/adminBlogPosts.service.ts server/src/controllers/adminBlogPosts.controller.ts server/src/routes/adminBlogPosts.routes.ts server/src/routes/admin.routes.ts
git commit -m "Admin blog yazısı CRUD uçlarını ekle"
```

---

## Task 9: Müşteri listesi ucu

**Files:**
- Create: `server/src/services/adminCustomers.service.ts`
- Create: `server/src/controllers/adminCustomers.controller.ts`
- Create: `server/src/routes/adminCustomers.routes.ts`
- Modify: `server/src/routes/admin.routes.ts`

**Interfaces:**
- Consumes: `authenticateAdmin`, `AdminAuthenticatedRequest` (Task 3), `getPointsBalance` (Task 4), `prisma.user`, `prisma.loyaltyPointTransaction` (mevcut)
- Produces: `GET /api/admin/customers` → `{ customers: { id, fullName, email, phone, pointsBalance, createdAt }[] }`

- [ ] **Step 1: Service'i yaz**

`server/src/services/adminCustomers.service.ts`:

```ts
import { prisma } from '../lib/prisma';
import { getPointsBalance } from './loyaltyCalc';

export async function listCustomers(businessId: string) {
  const [users, sums] = await Promise.all([
    prisma.user.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } }),
    prisma.loyaltyPointTransaction.groupBy({
      by: ['userId', 'type'],
      where: { businessId },
      _sum: { points: true },
    }),
  ]);

  const balanceMap = new Map<string, { earn: number; redeem: number }>();
  for (const row of sums) {
    const entry = balanceMap.get(row.userId) ?? { earn: 0, redeem: 0 };
    if (row.type === 'EARN') {
      entry.earn += row._sum.points ?? 0;
    } else {
      entry.redeem += row._sum.points ?? 0;
    }
    balanceMap.set(row.userId, entry);
  }

  return users.map((user) => {
    const entry = balanceMap.get(user.id) ?? { earn: 0, redeem: 0 };
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      pointsBalance: getPointsBalance(entry.earn, entry.redeem),
      createdAt: user.createdAt,
    };
  });
}
```

- [ ] **Step 2: Controller'ı yaz**

`server/src/controllers/adminCustomers.controller.ts`:

```ts
import { NextFunction, Response } from 'express';
import * as adminCustomersService from '../services/adminCustomers.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const customers = await adminCustomersService.listCustomers(req.adminAuth!.businessId);
    res.status(200).json({ customers });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Route'ları yaz**

`server/src/routes/adminCustomers.routes.ts`:

```ts
import { Router } from 'express';
import * as adminCustomersController from '../controllers/adminCustomers.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminCustomersRouter = Router();

adminCustomersRouter.use(authenticateAdmin);
adminCustomersRouter.get('/', adminCustomersController.list);
```

- [ ] **Step 4: `admin.routes.ts`'ye mount et**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';
import { adminBlogPostsRouter } from './adminBlogPosts.routes';
import { adminCustomersRouter } from './adminCustomers.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
adminRouter.use('/blog-posts', adminBlogPostsRouter);
adminRouter.use('/customers', adminCustomersRouter);
```

- [ ] **Step 5: Uçtan uca doğrula**

```bash
cd server && npx tsc --noEmit && npm run dev
```

```bash
curl -s http://localhost:4000/api/admin/customers -H "Authorization: Bearer <accessToken>"
```

Beklenen: `200` ve `{"customers": [...]}`. Henüz kayıtlı müşteri yoksa boş dizi de kabul edilir; varsa her müşteride `pointsBalance` alanı bulunmalı. Dev server'ı durdur.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/adminCustomers.service.ts server/src/controllers/adminCustomers.controller.ts server/src/routes/adminCustomers.routes.ts server/src/routes/admin.routes.ts
git commit -m "Admin müşteri listesi ucunu ekle"
```

---

## Task 10: Ürün listesi ucu (salt okunur, QR tarama ekranı için)

**Files:**
- Create: `server/src/services/adminProducts.service.ts`
- Create: `server/src/controllers/adminProducts.controller.ts`
- Create: `server/src/routes/adminProducts.routes.ts`
- Modify: `server/src/routes/admin.routes.ts`

**Interfaces:**
- Consumes: `authenticateAdmin`, `AdminAuthenticatedRequest` (Task 3), `prisma.product` (mevcut)
- Produces: `GET /api/admin/products` → `{ products: Product[] }` (yalnızca `isActive: true`). Task 19 (QR tarama ekranı) bu listeyi ürün seçimi için kullanır.

- [ ] **Step 1: Service'i yaz**

`server/src/services/adminProducts.service.ts`:

```ts
import { prisma } from '../lib/prisma';

export async function listProducts(businessId: string) {
  return prisma.product.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
  });
}
```

- [ ] **Step 2: Controller'ı yaz**

`server/src/controllers/adminProducts.controller.ts`:

```ts
import { NextFunction, Response } from 'express';
import * as adminProductsService from '../services/adminProducts.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const products = await adminProductsService.listProducts(req.adminAuth!.businessId);
    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Route'ları yaz**

`server/src/routes/adminProducts.routes.ts`:

```ts
import { Router } from 'express';
import * as adminProductsController from '../controllers/adminProducts.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminProductsRouter = Router();

adminProductsRouter.use(authenticateAdmin);
adminProductsRouter.get('/', adminProductsController.list);
```

- [ ] **Step 4: `admin.routes.ts`'ye mount et**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';
import { adminBlogPostsRouter } from './adminBlogPosts.routes';
import { adminCustomersRouter } from './adminCustomers.routes';
import { adminProductsRouter } from './adminProducts.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
adminRouter.use('/blog-posts', adminBlogPostsRouter);
adminRouter.use('/customers', adminCustomersRouter);
adminRouter.use('/products', adminProductsRouter);
```

- [ ] **Step 5: Uçtan uca doğrula**

```bash
cd server && npx tsc --noEmit && npm run dev
```

```bash
curl -s http://localhost:4000/api/admin/products -H "Authorization: Bearer <accessToken>"
```

Beklenen: `200` ve seed'deki `Latte`, `Filtre Kahve` ürünlerini içeren `{"products": [...]}`. Dev server'ı durdur.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/adminProducts.service.ts server/src/controllers/adminProducts.controller.ts server/src/routes/adminProducts.routes.ts server/src/routes/admin.routes.ts
git commit -m "Admin ürün listesi ucunu ekle"
```

---

## Task 11: QR tarama ve ödül verme uçları

**Files:**
- Create: `server/src/validators/adminLoyalty.validators.ts`
- Create: `server/src/services/adminLoyalty.service.ts`
- Create: `server/src/controllers/adminLoyalty.controller.ts`
- Create: `server/src/routes/adminLoyalty.routes.ts`
- Modify: `server/src/routes/admin.routes.ts`

**Interfaces:**
- Consumes: `authenticateAdmin`, `AdminAuthenticatedRequest` (Task 3), `getPointsBalance`, `isRewardEligible`, `computeRedeemBalance`, `parseUserIdFromQrValue` (Task 4), `prisma.user`, `prisma.product`, `prisma.business`, `prisma.loyaltyPointTransaction` (mevcut)
- Produces: `POST /api/admin/loyalty/scan` → `{ pointsBalance, rewardEligible, threshold }`; `POST /api/admin/loyalty/redeem` → `{ pointsBalance }`

- [ ] **Step 1: Validator'ı yaz**

`server/src/validators/adminLoyalty.validators.ts`:

```ts
import { z } from 'zod';

export const scanSchema = z.object({
  qrValue: z.string().min(1, 'qrValue gerekli'),
  productId: z.string().uuid('Geçerli bir ürün seçin'),
});

export const redeemSchema = z.object({
  userId: z.string().uuid('Geçerli bir kullanıcı seçin'),
});

export type ScanInput = z.infer<typeof scanSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
```

- [ ] **Step 2: Service'i yaz**

`server/src/services/adminLoyalty.service.ts`:

```ts
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  computeRedeemBalance,
  getPointsBalance,
  isRewardEligible,
  parseUserIdFromQrValue,
} from './loyaltyCalc';
import type { RedeemInput, ScanInput } from '../validators/adminLoyalty.validators';

async function getUserPointsSums(businessId: string, userId: string) {
  const [earnAgg, redeemAgg] = await Promise.all([
    prisma.loyaltyPointTransaction.aggregate({
      where: { businessId, userId, type: 'EARN' },
      _sum: { points: true },
    }),
    prisma.loyaltyPointTransaction.aggregate({
      where: { businessId, userId, type: 'REDEEM' },
      _sum: { points: true },
    }),
  ]);
  return { earn: earnAgg._sum.points ?? 0, redeem: redeemAgg._sum.points ?? 0 };
}

async function requireBusinessUser(businessId: string, userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, businessId } });
  if (!user) {
    throw new AppError(404, 'Bu işletmeye kayıtlı müşteri bulunamadı');
  }
  return user;
}

export async function scanProduct(businessId: string, input: ScanInput) {
  const userId = parseUserIdFromQrValue(input.qrValue);
  await requireBusinessUser(businessId, userId);

  const product = await prisma.product.findFirst({
    where: { id: input.productId, businessId, isActive: true },
  });
  if (!product) {
    throw new AppError(404, 'Ürün bulunamadı');
  }

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

  await prisma.loyaltyPointTransaction.create({
    data: {
      userId,
      businessId,
      productId: product.id,
      points: product.pointsReward,
      type: 'EARN',
    },
  });

  const sums = await getUserPointsSums(businessId, userId);
  const pointsBalance = getPointsBalance(sums.earn, sums.redeem);

  return {
    pointsBalance,
    rewardEligible: isRewardEligible(pointsBalance, business.loyaltyTargetCups),
    threshold: business.loyaltyTargetCups,
  };
}

export async function redeemReward(businessId: string, input: RedeemInput) {
  await requireBusinessUser(businessId, input.userId);

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const sums = await getUserPointsSums(businessId, input.userId);
  const currentBalance = getPointsBalance(sums.earn, sums.redeem);
  const newBalance = computeRedeemBalance(currentBalance, business.loyaltyTargetCups);

  await prisma.loyaltyPointTransaction.create({
    data: {
      userId: input.userId,
      businessId,
      points: business.loyaltyTargetCups,
      type: 'REDEEM',
      note: 'Ücretsiz ürün verildi',
    },
  });

  return { pointsBalance: newBalance };
}
```

- [ ] **Step 3: Controller'ı yaz**

`server/src/controllers/adminLoyalty.controller.ts`:

```ts
import { NextFunction, Response } from 'express';
import { redeemSchema, scanSchema } from '../validators/adminLoyalty.validators';
import * as adminLoyaltyService from '../services/adminLoyalty.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function scan(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = scanSchema.parse(req.body);
    const result = await adminLoyaltyService.scanProduct(req.adminAuth!.businessId, input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function redeem(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = redeemSchema.parse(req.body);
    const result = await adminLoyaltyService.redeemReward(req.adminAuth!.businessId, input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Route'ları yaz**

`server/src/routes/adminLoyalty.routes.ts`:

```ts
import { Router } from 'express';
import * as adminLoyaltyController from '../controllers/adminLoyalty.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminLoyaltyRouter = Router();

adminLoyaltyRouter.use(authenticateAdmin);
adminLoyaltyRouter.post('/scan', adminLoyaltyController.scan);
adminLoyaltyRouter.post('/redeem', adminLoyaltyController.redeem);
```

- [ ] **Step 5: `admin.routes.ts`'ye mount et**

`server/src/routes/admin.routes.ts`:

```ts
import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';
import { adminBlogPostsRouter } from './adminBlogPosts.routes';
import { adminCustomersRouter } from './adminCustomers.routes';
import { adminProductsRouter } from './adminProducts.routes';
import { adminLoyaltyRouter } from './adminLoyalty.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
adminRouter.use('/blog-posts', adminBlogPostsRouter);
adminRouter.use('/customers', adminCustomersRouter);
adminRouter.use('/products', adminProductsRouter);
adminRouter.use('/loyalty', adminLoyaltyRouter);
```

- [ ] **Step 6: Uçtan uca doğrula**

Önce mobile taraftan (veya doğrudan register ucundan) bir müşteri oluştur:

```bash
cd server && npx tsc --noEmit && npm run dev
```

```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Müşteri","email":"test.musteri@example.com","password":"parola123","phone":"+905551112233"}'
```

Dönen `user.id` değerini `<userId>` olarak kullan (ürün id'si için Task 10'daki `GET /api/admin/products` çağrısından `Latte` ürününün id'sini al):

```bash
curl -s -X POST http://localhost:4000/api/admin/loyalty/scan \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"qrValue":"laos-clone:user:<userId>","productId":"<productId>"}'
```

Beklenen: `200` ve `{"pointsBalance":1,"rewardEligible":false,"threshold":6}` (seed eşiği 6, veya Task 6'da 8 yaptıysan 8). `loyaltyTargetCups` değerine ulaşana kadar aynı isteği tekrarla, eşiğe ulaşınca `rewardEligible: true` dönmeli. Ardından:

```bash
curl -s -X POST http://localhost:4000/api/admin/loyalty/redeem \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"userId":"<userId>"}'
```

Beklenen: `200` ve `pointsBalance` eşik kadar düşmüş olarak döner. Eşik altındayken tekrar `redeem` çağrılırsa `400` dönmeli. Dev server'ı durdur.

- [ ] **Step 7: Commit**

```bash
git add server/src/validators/adminLoyalty.validators.ts server/src/services/adminLoyalty.service.ts server/src/controllers/adminLoyalty.controller.ts server/src/routes/adminLoyalty.routes.ts server/src/routes/admin.routes.ts
git commit -m "QR tarama ve odul verme uclarini ekle"
```

---

## Task 12: Vite admin frontend iskeleti

**Files:**
- Create: `admin/` (vite scaffold ile üretilir)
- Modify: `admin/package.json`

**Interfaces:**
- Produces: `admin/` altında çalışan bir Vite+React+TS dev sunucusu, `react-router-dom`, `axios`, `zustand`, `@tanstack/react-query`, `html5-qrcode` bağımlılıkları kurulu. Task 13+ bu iskelet üzerine inşa eder.

- [ ] **Step 1: Vite projesini oluştur**

Repo kökünde (`laos-clone/`):

```bash
npm create vite@latest admin -- --template react-ts
```

- [ ] **Step 2: Bağımlılıkları kur**

```bash
cd admin
npm install
npm install axios react-router-dom zustand @tanstack/react-query html5-qrcode
```

- [ ] **Step 3: `.env.example` ekle**

`admin/.env.example`:

```
VITE_API_URL=http://localhost:4000/api
```

- [ ] **Step 4: Yerel `.env` ekle**

`admin/.env`:

```
VITE_API_URL=http://localhost:4000/api
```

- [ ] **Step 5: Dev sunucusunun çalıştığını doğrula**

```bash
npm run dev -- --port 5174
```

Beklenen: terminalde `Local: http://localhost:5174/` çıktısı. Tarayıcıda açıp Vite'ın varsayılan sayfasının göründüğünü doğrula, sonra sunucuyu durdur (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
cd ..
git add admin
git commit -m "Vite admin frontend iskeletini olustur"
```

---

## Task 13: Admin API client, token store, auth store ve tipler

**Files:**
- Create: `admin/src/types/index.ts`
- Create: `admin/src/api/tokenStore.ts`
- Create: `admin/src/api/client.ts`
- Create: `admin/src/api/auth.ts`
- Create: `admin/src/api/business.ts`
- Create: `admin/src/api/campaigns.ts`
- Create: `admin/src/api/blogPosts.ts`
- Create: `admin/src/api/customers.ts`
- Create: `admin/src/api/products.ts`
- Create: `admin/src/api/loyalty.ts`
- Create: `admin/src/store/useAdminAuthStore.ts`

**Interfaces:**
- Produces: `AdminUser`, `Business`, `Campaign`, `BlogPost`, `Customer`, `Product`, `ScanResult`, `RedeemResult` tipleri; `apiClient` (axios instance); `useAdminAuthStore` (zustand: `adminUser`, `isAuthenticated`, `isHydrating`, `login(email, password)`, `hydrate()`, `logout()`). Task 14+ tüm sayfalar bunları kullanır.

- [ ] **Step 1: Ortak tipleri tanımla**

`admin/src/types/index.ts`:

```ts
export interface AdminUser {
  id: string;
  businessId: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  workingHours: Record<string, string>;
  loyaltyTargetCups: number;
}

export interface Campaign {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  businessId: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  pointsBalance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  pointsReward: number;
  price: string;
  isActive: boolean;
}

export interface ScanResult {
  pointsBalance: number;
  rewardEligible: boolean;
  threshold: number;
}

export interface RedeemResult {
  pointsBalance: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
```

- [ ] **Step 2: Token store'u yaz**

`admin/src/api/tokenStore.ts`:

```ts
let currentAccessToken: string | null = null;

export function setCurrentAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getCurrentAccessToken(): string | null {
  return currentAccessToken;
}
```

- [ ] **Step 3: API client'ı yaz**

`admin/src/api/client.ts`:

```ts
import axios from 'axios';
import { getCurrentAccessToken } from './tokenStore';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getCurrentAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] **Step 4: Auth API fonksiyonlarını yaz**

`admin/src/api/auth.ts`:

```ts
import { apiClient } from './client';
import { AdminUser, AuthTokens } from '../types';

interface AdminAuthResponse {
  adminUser: AdminUser;
  tokens: AuthTokens;
}

export async function loginRequest(email: string, password: string): Promise<AdminAuthResponse> {
  const { data } = await apiClient.post<AdminAuthResponse>('/admin/auth/login', { email, password });
  return data;
}

export async function refreshRequest(refreshToken: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>('/admin/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function meRequest(): Promise<{ adminUser: AdminUser }> {
  const { data } = await apiClient.get<{ adminUser: AdminUser }>('/admin/auth/me');
  return data;
}
```

- [ ] **Step 5: Business API fonksiyonlarını yaz**

`admin/src/api/business.ts`:

```ts
import { apiClient } from './client';
import { Business } from '../types';

export async function getBusinessRequest(): Promise<Business> {
  const { data } = await apiClient.get<{ business: Business }>('/admin/business');
  return data.business;
}

export async function updateBusinessRequest(input: Partial<Business>): Promise<Business> {
  const { data } = await apiClient.patch<{ business: Business }>('/admin/business', input);
  return data.business;
}
```

- [ ] **Step 6: Campaigns API fonksiyonlarını yaz**

`admin/src/api/campaigns.ts`:

```ts
import { apiClient } from './client';
import { Campaign } from '../types';

export interface CampaignInput {
  title: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export async function listCampaignsRequest(): Promise<Campaign[]> {
  const { data } = await apiClient.get<{ campaigns: Campaign[] }>('/admin/campaigns');
  return data.campaigns;
}

export async function createCampaignRequest(input: CampaignInput): Promise<Campaign> {
  const { data } = await apiClient.post<{ campaign: Campaign }>('/admin/campaigns', input);
  return data.campaign;
}

export async function updateCampaignRequest(id: string, input: Partial<CampaignInput>): Promise<Campaign> {
  const { data } = await apiClient.patch<{ campaign: Campaign }>(`/admin/campaigns/${id}`, input);
  return data.campaign;
}

export async function deleteCampaignRequest(id: string): Promise<void> {
  await apiClient.delete(`/admin/campaigns/${id}`);
}
```

- [ ] **Step 7: Blog posts API fonksiyonlarını yaz**

`admin/src/api/blogPosts.ts`:

```ts
import { apiClient } from './client';
import { BlogPost } from '../types';

export interface BlogPostInput {
  title: string;
  content: string;
  coverImageUrl?: string;
  isPublished?: boolean;
}

export async function listBlogPostsRequest(): Promise<BlogPost[]> {
  const { data } = await apiClient.get<{ posts: BlogPost[] }>('/admin/blog-posts');
  return data.posts;
}

export async function createBlogPostRequest(input: BlogPostInput): Promise<BlogPost> {
  const { data } = await apiClient.post<{ post: BlogPost }>('/admin/blog-posts', input);
  return data.post;
}

export async function updateBlogPostRequest(id: string, input: Partial<BlogPostInput>): Promise<BlogPost> {
  const { data } = await apiClient.patch<{ post: BlogPost }>(`/admin/blog-posts/${id}`, input);
  return data.post;
}

export async function deleteBlogPostRequest(id: string): Promise<void> {
  await apiClient.delete(`/admin/blog-posts/${id}`);
}
```

- [ ] **Step 8: Customers, products ve loyalty API fonksiyonlarını yaz**

`admin/src/api/customers.ts`:

```ts
import { apiClient } from './client';
import { Customer } from '../types';

export async function listCustomersRequest(): Promise<Customer[]> {
  const { data } = await apiClient.get<{ customers: Customer[] }>('/admin/customers');
  return data.customers;
}
```

`admin/src/api/products.ts`:

```ts
import { apiClient } from './client';
import { Product } from '../types';

export async function listProductsRequest(): Promise<Product[]> {
  const { data } = await apiClient.get<{ products: Product[] }>('/admin/products');
  return data.products;
}
```

`admin/src/api/loyalty.ts`:

```ts
import { apiClient } from './client';
import { RedeemResult, ScanResult } from '../types';

export async function scanRequest(qrValue: string, productId: string): Promise<ScanResult> {
  const { data } = await apiClient.post<ScanResult>('/admin/loyalty/scan', { qrValue, productId });
  return data;
}

export async function redeemRequest(userId: string): Promise<RedeemResult> {
  const { data } = await apiClient.post<RedeemResult>('/admin/loyalty/redeem', { userId });
  return data;
}
```

- [ ] **Step 9: Auth store'u yaz**

`admin/src/store/useAdminAuthStore.ts`:

```ts
import { create } from 'zustand';
import { AdminUser } from '../types';
import { setCurrentAccessToken } from '../api/tokenStore';
import { loginRequest, meRequest, refreshRequest } from '../api/auth';

const REFRESH_TOKEN_KEY = 'laos_admin_refresh_token';

interface AdminAuthState {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  adminUser: null,
  isAuthenticated: false,
  isHydrating: true,
  login: async (email, password) => {
    const { adminUser, tokens } = await loginRequest(email, password);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    setCurrentAccessToken(tokens.accessToken);
    set({ adminUser, isAuthenticated: true, isHydrating: false });
  },
  hydrate: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      set({ isHydrating: false, isAuthenticated: false });
      return;
    }
    try {
      const { accessToken } = await refreshRequest(refreshToken);
      setCurrentAccessToken(accessToken);
      const { adminUser } = await meRequest();
      set({ adminUser, isAuthenticated: true, isHydrating: false });
    } catch {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setCurrentAccessToken(null);
      set({ adminUser: null, isAuthenticated: false, isHydrating: false });
    }
  },
  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setCurrentAccessToken(null);
    set({ adminUser: null, isAuthenticated: false });
  },
}));
```

- [ ] **Step 10: Derlemenin bozulmadığını doğrula**

```bash
cd admin && npx tsc --noEmit
```

Beklenen: hatasız biter (henüz hiçbir bileşen bu dosyaları kullanmıyor ama tip hatası olmamalı).

- [ ] **Step 11: Commit**

```bash
cd ..
git add admin/src/types admin/src/api admin/src/store admin/.env.example
git commit -m "Admin API client, auth store ve tipleri ekle"
```

---

## Task 14: Login sayfası, korumalı route ve layout

**Files:**
- Create: `admin/src/pages/LoginPage.tsx`
- Create: `admin/src/components/ProtectedRoute.tsx`
- Create: `admin/src/components/Layout.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/main.tsx`
- Create: `admin/src/index.css` (üzerine yazılır)

**Interfaces:**
- Consumes: `useAdminAuthStore` (Task 13)
- Produces: `/login` route, korumalı `/` altında sidebar'lı layout. Task 15-19 sayfaları `Layout` içindeki `<Outlet />` altına route olarak eklenir.

- [ ] **Step 1: Basit global stiller**

`admin/src/index.css` dosyasının tüm içeriğini şununla değiştir:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #f5f2ef;
  color: #2b1c12;
}

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #2b1c12;
  color: #f5f2ef;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar h1 {
  font-size: 18px;
  margin: 0 0 24px;
}

.sidebar a {
  color: #f5f2ef;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
}

.sidebar a.active,
.sidebar a:hover {
  background: #6b3e26;
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
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

input,
textarea,
select {
  width: 100%;
  padding: 8px 10px;
  margin-top: 4px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  background: #6b3e26;
  color: white;
  font-size: 14px;
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
  border-bottom: 1px solid #ddd;
}

.error-text {
  color: #b3261e;
  font-size: 13px;
  margin-bottom: 12px;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.row-actions {
  display: flex;
  gap: 8px;
}
```

- [ ] **Step 2: Login sayfasını yaz**

`admin/src/pages/LoginPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

export function LoginPage() {
  const login = useAdminAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('E-posta veya şifre hatalı');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Admin Girişi</h1>
        {error && <p className="error-text">{error}</p>}
        <label>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Korumalı route bileşenini yaz**

`admin/src/components/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

export function ProtectedRoute() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAdminAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return <p style={{ padding: 32 }}>Yükleniyor...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

- [ ] **Step 4: Layout'u yaz**

`admin/src/components/Layout.tsx`:

```tsx
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

const links = [
  { to: '/business', label: 'İşletme Bilgileri' },
  { to: '/campaigns', label: 'Kampanyalar' },
  { to: '/blog', label: 'Blog' },
  { to: '/customers', label: 'Müşteriler' },
  { to: '/scan', label: 'QR Tarayıcı' },
];

export function Layout() {
  const logout = useAdminAuthStore((state) => state.logout);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Laos Admin</h1>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {link.label}
          </NavLink>
        ))}
        <button type="button" onClick={logout} style={{ marginTop: 24 }}>
          Çıkış Yap
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: `App.tsx`'i yaz**

`admin/src/App.tsx` dosyasının tüm içeriğini şununla değiştir:

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/business" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 6: `main.tsx`'i yaz**

`admin/src/main.tsx` dosyasının tüm içeriğini şununla değiştir:

```tsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { useAdminAuthStore } from './store/useAdminAuthStore';
import './index.css';

const queryClient = new QueryClient();

function Root() {
  const hydrate = useAdminAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
```

- [ ] **Step 7: Kullanılmayan varsayılan dosyaları temizle**

```bash
cd admin
rm -f src/App.css src/assets/react.svg
rmdir src/assets 2>/dev/null || true
```

- [ ] **Step 8: Derlemenin bozulmadığını doğrula ve tarayıcıda test et**

```bash
npx tsc --noEmit
npm run dev -- --port 5174
```

Tarayıcıda `http://localhost:5174` aç. Beklenen: `/login`'e yönlendirilirsin (Task 6-11'de backend'i `npm run dev` ile çalıştırmış olman gerekir). `admin@lakiscoffee.com` / `admin1234` ile giriş yap; başarılı girişte `/business`'e yönlendirilip boş bir sayfa (henüz `BusinessPage` yok, Task 15'te eklenecek) yerine sidebar'lı layout görünmeli — `/business` route'u henüz tanımlı değilse `Layout` içinde boş bir `<Outlet />` alanı görünür, bu normaldir. Sunucuyu durdur.

- [ ] **Step 9: Commit**

```bash
cd ..
git add admin/src
git commit -m "Login sayfasi, korumali route ve admin layout ekle"
```

---

## Task 15: İşletme bilgileri sayfası

**Files:**
- Create: `admin/src/pages/BusinessPage.tsx`
- Modify: `admin/src/App.tsx`

**Interfaces:**
- Consumes: `getBusinessRequest`, `updateBusinessRequest` (Task 13)
- Produces: `/business` route

- [ ] **Step 1: Sayfayı yaz**

`admin/src/pages/BusinessPage.tsx`:

```tsx
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBusinessRequest, updateBusinessRequest } from '../api/business';
import { Business } from '../types';

type FormState = Pick<
  Business,
  'name' | 'category' | 'address' | 'phone' | 'email' | 'loyaltyTargetCups'
>;

export function BusinessPage() {
  const queryClient = useQueryClient();
  const { data: business, isLoading } = useQuery({ queryKey: ['business'], queryFn: getBusinessRequest });
  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setMessage(null);
    mutation.mutate(form);
  }

  if (isLoading || !form) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div>
      <h2>İşletme Bilgileri</h2>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>
          İşletme Adı
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Kategori
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
        </label>
        <label>
          Adres
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </label>
        <label>
          Telefon
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </label>
        <label>
          E-posta
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label>
          Ücretsiz Ürün Puan Eşiği
          <input
            type="number"
            min={1}
            value={form.loyaltyTargetCups}
            onChange={(e) => setForm({ ...form, loyaltyTargetCups: Number(e.target.value) })}
            required
          />
        </label>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {message && <p style={{ color: 'green', marginTop: 8 }}>{message}</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Route'u ekle**

`admin/src/App.tsx` içinde `import { LoginPage } ...` satırının altına ekle:

```tsx
import { BusinessPage } from './pages/BusinessPage';
```

`<Route index element={<Navigate to="/business" replace />} />` satırının altına ekle:

```tsx
          <Route path="business" element={<BusinessPage />} />
```

- [ ] **Step 3: Tarayıcıda doğrula**

```bash
cd server && npm run dev
```

Ayrı terminalde:

```bash
cd admin && npm run dev -- --port 5174
```

Tarayıcıda giriş yap, `/business` sayfasında mevcut işletme bilgilerinin dolu geldiğini, "Ücretsiz Ürün Puan Eşiği" alanını değiştirip "Kaydet"e basınca "Kaydedildi" mesajının çıktığını ve sayfa yenilenince yeni değerin kalıcı olduğunu doğrula. İki sunucuyu da durdur.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/BusinessPage.tsx admin/src/App.tsx
git commit -m "Isletme bilgileri sayfasini ekle"
```

---

## Task 16: Kampanyalar sayfası

**Files:**
- Create: `admin/src/pages/CampaignsPage.tsx`
- Modify: `admin/src/App.tsx`

**Interfaces:**
- Consumes: `listCampaignsRequest`, `createCampaignRequest`, `updateCampaignRequest`, `deleteCampaignRequest` (Task 13)
- Produces: `/campaigns` route

- [ ] **Step 1: Sayfayı yaz**

`admin/src/pages/CampaignsPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CampaignInput,
  createCampaignRequest,
  deleteCampaignRequest,
  listCampaignsRequest,
  updateCampaignRequest,
} from '../api/campaigns';
import { Campaign } from '../types';

const emptyForm: CampaignInput = { title: '', description: '', startDate: '', endDate: '', isActive: true };

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: listCampaignsRequest,
  });
  const [form, setForm] = useState<CampaignInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] });

  const createMutation = useMutation({
    mutationFn: createCampaignRequest,
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CampaignInput> }) =>
      updateCampaignRequest(id, input),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaignRequest,
    onSuccess: invalidate,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
      </form>

      {isLoading ? (
        <p>Yükleniyor...</p>
      ) : (
        campaigns.map((campaign) => (
          <div key={campaign.id} className="card">
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
```

- [ ] **Step 2: Route'u ekle**

`admin/src/App.tsx` içine import ekle:

```tsx
import { CampaignsPage } from './pages/CampaignsPage';
```

`<Route path="business" ... />` satırının altına ekle:

```tsx
          <Route path="campaigns" element={<CampaignsPage />} />
```

- [ ] **Step 3: Tarayıcıda doğrula**

Backend ve admin dev sunucularını çalıştır, `/campaigns` sayfasında yeni kampanya ekle, listede göründüğünü doğrula, düzenle ve sil işlemlerini dene. Sunucuları durdur.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/CampaignsPage.tsx admin/src/App.tsx
git commit -m "Kampanyalar sayfasini ekle"
```

---

## Task 17: Blog sayfası

**Files:**
- Create: `admin/src/pages/BlogPage.tsx`
- Modify: `admin/src/App.tsx`

**Interfaces:**
- Consumes: `listBlogPostsRequest`, `createBlogPostRequest`, `updateBlogPostRequest`, `deleteBlogPostRequest` (Task 13)
- Produces: `/blog` route

- [ ] **Step 1: Sayfayı yaz**

`admin/src/pages/BlogPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BlogPostInput,
  createBlogPostRequest,
  deleteBlogPostRequest,
  listBlogPostsRequest,
  updateBlogPostRequest,
} from '../api/blogPosts';
import { BlogPost } from '../types';

const emptyForm: BlogPostInput = { title: '', content: '', isPublished: false };

export function BlogPage() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery({ queryKey: ['blogPosts'], queryFn: listBlogPostsRequest });
  const [form, setForm] = useState<BlogPostInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['blogPosts'] });

  const createMutation = useMutation({
    mutationFn: createBlogPostRequest,
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BlogPostInput> }) =>
      updateBlogPostRequest(id, input),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPostRequest,
    onSuccess: invalidate,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({ title: post.title, content: post.content, isPublished: post.isPublished });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Blog</h2>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>
          Başlık
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          İçerik
          <textarea
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            style={{ width: 'auto', display: 'inline-block', marginRight: 8 }}
          />
          Yayınla
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
      </form>

      {isLoading ? (
        <p>Yükleniyor...</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card">
            <strong>{post.title}</strong> {post.isPublished ? '(yayında)' : '(taslak)'}
            <p>/{post.slug}</p>
            <div className="row-actions">
              <button type="button" onClick={() => startEdit(post)}>
                Düzenle
              </button>
              <button type="button" onClick={() => deleteMutation.mutate(post.id)}>
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Route'u ekle**

`admin/src/App.tsx` içine import ekle:

```tsx
import { BlogPage } from './pages/BlogPage';
```

`<Route path="campaigns" ... />` satırının altına ekle:

```tsx
          <Route path="blog" element={<BlogPage />} />
```

- [ ] **Step 3: Tarayıcıda doğrula**

Backend ve admin dev sunucularını çalıştır, `/blog` sayfasında yeni yazı ekle (yayınla işaretli), listede `(yayında)` etiketiyle ve otomatik üretilen slug ile göründüğünü doğrula. Sunucuları durdur.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/BlogPage.tsx admin/src/App.tsx
git commit -m "Blog sayfasini ekle"
```

---

## Task 18: Müşteriler sayfası

**Files:**
- Create: `admin/src/pages/CustomersPage.tsx`
- Modify: `admin/src/App.tsx`

**Interfaces:**
- Consumes: `listCustomersRequest` (Task 13)
- Produces: `/customers` route

- [ ] **Step 1: Sayfayı yaz**

`admin/src/pages/CustomersPage.tsx`:

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
    <div>
      <h2>Müşteriler</h2>
      <table>
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Telefon</th>
            <th>Puan</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.fullName}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.pointsBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Route'u ekle**

`admin/src/App.tsx` içine import ekle:

```tsx
import { CustomersPage } from './pages/CustomersPage';
```

`<Route path="blog" ... />` satırının altına ekle:

```tsx
          <Route path="customers" element={<CustomersPage />} />
```

- [ ] **Step 3: Tarayıcıda doğrula**

Task 11 Step 6'da oluşturduğun test müşterisinin `/customers` sayfasında doğru puan bakiyesiyle listelendiğini doğrula.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/CustomersPage.tsx admin/src/App.tsx
git commit -m "Musteriler sayfasini ekle"
```

---

## Task 19: QR Tarayıcı sayfası

**Files:**
- Create: `admin/src/pages/ScanPage.tsx`
- Modify: `admin/src/App.tsx`

**Interfaces:**
- Consumes: `listProductsRequest` (Task 13), `scanRequest`, `redeemRequest` (Task 13), `Html5Qrcode` (`html5-qrcode` paketi)
- Produces: `/scan` route

- [ ] **Step 1: Sayfayı yaz**

`admin/src/pages/ScanPage.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listProductsRequest } from '../api/products';
import { redeemRequest, scanRequest } from '../api/loyalty';
import { ScanResult } from '../types';

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
```

- [ ] **Step 2: Route'u ekle**

`admin/src/App.tsx` içine import ekle:

```tsx
import { ScanPage } from './pages/ScanPage';
```

`<Route path="customers" ... />` satırının altına ekle:

```tsx
          <Route path="scan" element={<ScanPage />} />
```

- [ ] **Step 3: Derlemenin bozulmadığını doğrula**

```bash
cd admin && npx tsc --noEmit
```

- [ ] **Step 4: Tarayıcıda uçtan uca doğrula**

Backend ve admin dev sunucularını çalıştır. `/scan` sayfasında:
1. Kamera izni istenirse reddet veya kamerasız bir ortamda test et — "Manuel QR Metni" alanı görünmeli.
2. Bir ürün seç, manuel alana `laos-clone:user:<Task 11'deki test müşterisinin id'si>` yaz, "Puan Ekle"ye bas.
3. "Güncel bakiye: X / Y" mesajının göründüğünü doğrula.
4. Eşiğe ulaşana kadar tekrarla; eşikte "Ücretsiz Ürün Ver" butonunun çıktığını, tıklayınca bakiyenin eşik kadar düştüğünü ve butonun kaybolduğunu doğrula.

Sunucuları durdur.

- [ ] **Step 5: Commit**

```bash
git add admin/src/pages/ScanPage.tsx admin/src/App.tsx
git commit -m "QR Tarayici sayfasini ekle"
```

---

## Task 20: README güncellemesi ve son doğrulama

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: yok (dokümantasyon görevi)

- [ ] **Step 1: README'ye admin bölümü ekle**

`README.md` içinde `## Yapı` bölümündeki kod bloğunu güncelle:

```
server/   Express + TypeScript API, Prisma ORM, PostgreSQL
mobile/   Expo (React Native) uygulaması
admin/    Vite + React admin paneli (işletme/kampanya/blog/müşteri yönetimi, QR puan sistemi)
```

`### Mobile` bölümünün altına yeni bir bölüm ekle:

```markdown
### Admin

- Vite, React 18, TypeScript
- React Router, TanStack Query (server state), Zustand (auth state), Axios
- `html5-qrcode` ile tarayıcı üzerinden QR okuma

## Admin Paneli Kurulumu

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Varsayılan admin hesabı (seed ile oluşturulur): `admin@lakiscoffee.com` / `admin1234`
```

`## Ortam değişkenleri` tablosuna şu satırları ekle:

```
| `server/.env` | `ADMIN_JWT_ACCESS_SECRET`, `ADMIN_JWT_REFRESH_SECRET` | Admin paneli JWT imzalama anahtarları |
| `admin/.env` | `VITE_API_URL` | Admin panelinin erişeceği API adresi |
```

- [ ] **Step 2: Tüm birim testlerini son kez çalıştır**

```bash
cd server && npm test
```

Beklenen: tüm testler PASS.

- [ ] **Step 3: Tam uçtan uca akışı tekrar doğrula**

```bash
docker compose up -d
cd server && npm run dev
```

Ayrı terminalde:

```bash
cd admin && npm run dev -- --port 5174
```

Tarayıcıda: giriş yap → İşletme Bilgileri'nde eşiği düzenle → Kampanyalar'da bir kampanya ekle/sil → Blog'da bir yazı ekle/yayınla → Müşteriler'de test müşterisini gör → QR Tarayıcı'da puan ekle ve eşikte ödül ver. Hepsi hatasız çalışmalı. Sunucuları durdur.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "README'ye admin paneli dokumantasyonunu ekle"
```

- [ ] **Step 5: Feature branch'i push et**

```bash
git push origin feature/admin-panel-qr-loyalty
```
