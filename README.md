# laos-clone

Kahve dükkânı sadakat programı uygulaması. İki parçadan oluşur: bir Express/Prisma API sunucusu (`server/`) ve bir Expo/React Native mobil uygulama (`mobile/`).

## Yapı

```
server/   Express + TypeScript API, Prisma ORM, PostgreSQL
mobile/   Expo (React Native) uygulaması
admin/    Vite + React admin paneli (işletme/kampanya/blog/müşteri yönetimi, QR puan sistemi)
```

### Server

- Express 5, TypeScript
- Prisma 7 (PostgreSQL, `@prisma/adapter-pg` driver adapter)
- JWT tabanlı kimlik doğrulama (access + refresh token), bcrypt ile şifre hash'leme
- Zod ile istek doğrulama

### Mobile

- Expo SDK 54, React Native 0.81
- React Navigation (stack + bottom tabs)
- Zustand (state), NativeWind/Tailwind (stil), Axios (API istekleri)

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

> ⚠️ **Uyarı:** Bu, sadece yerel geliştirme için seed edilen bir varsayılan şifredir. Local dışında (staging, production veya herhangi bir dışa açık ortam) deploy etmeden önce mutlaka değiştirilmelidir.

## Kurulum

### 1. PostgreSQL

```bash
docker compose up -d
```

`docker-compose.yml`, `localhost:5432` üzerinde `laos_clone` adında bir veritabanı başlatır.

### 2. Server

```bash
cd server
cp .env.example .env   # JWT_ACCESS_SECRET / JWT_REFRESH_SECRET değerlerini değiştirin
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API varsayılan olarak `http://localhost:4000` üzerinde çalışır, uç noktalar `/api/auth/*` altındadır (`register`, `login`, `refresh`, `logout`, `me`).

### 3. Mobile

```bash
cd mobile
cp .env.example .env   # EXPO_PUBLIC_API_URL değerini bilgisayarınızın LAN IP'siyle güncelleyin
npm install
npm run start
```

Expo Go ile telefondan test edebilmek için `EXPO_PUBLIC_API_URL`'in `localhost` değil, bilgisayarınızın ağdaki IP adresi olması gerekir.

## Ortam değişkenleri

| Dosya | Değişken | Açıklama |
| --- | --- | --- |
| `server/.env` | `DATABASE_URL` | PostgreSQL bağlantı string'i |
| `server/.env` | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | JWT imzalama anahtarları |
| `server/.env` | `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token ömürleri (saniye) |
| `mobile/.env` | `EXPO_PUBLIC_API_URL` | Mobil uygulamanın erişeceği API adresi |
| `server/.env` | `ADMIN_JWT_ACCESS_SECRET`, `ADMIN_JWT_REFRESH_SECRET` | Admin paneli JWT imzalama anahtarları |
| `admin/.env` | `VITE_API_URL` | Admin panelinin erişeceği API adresi |
