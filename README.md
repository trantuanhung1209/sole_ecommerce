# SOLE — Shoe E-commerce

Full-stack shoe e-commerce platform.

## Bàn giao khách hàng (Handover)

### Bộ tài liệu

| File | Nội dung |
|------|----------|
| [`README.md`](./README.md) | Chạy nhanh, env, tài khoản demo, script vận hành |
| [`docs/SHOE_ECOMMERCE_SPECIFICATION.md`](./docs/SHOE_ECOMMERCE_SPECIFICATION.md) | Spec tổng hợp — **§20 Handover & vận hành** |
| [`docs/FUNCTIONAL_FLOWS.md`](./docs/FUNCTIONAL_FLOWS.md) | Sơ đồ luồng Mermaid (mua hàng, return, payment, …) |
| [`docs/UI_DESIGN_SYSTEM.md`](./docs/UI_DESIGN_SYSTEM.md) | Design tokens, component, layout FE |

### URL mặc định (local)

| Khu vực | URL | Ghi chú |
|---------|-----|---------|
| Storefront | http://localhost:3000 | Trang khách |
| Admin | http://localhost:3000/admin | `admin@sole.test` |
| Staff | http://localhost:3000/staff | `staff@sole.test` |
| API | http://localhost:3001/api | Base path REST |
| Swagger | http://localhost:3001/swagger-ui.html | Tắt trên profile `prod` |
| Redis UI | http://localhost:8082 | Docker — user/pass trong `.env` |

### Chạy demo nhanh

```bash
cp .env.example .env
chmod +x scripts/demo-up.sh
./scripts/demo-up.sh
```

Đăng nhập thử: `customer@sole.test` / `Sole@123` (xem bảng tài khoản demo bên dưới).

### Kiểm thử trước bàn giao

```bash
cd be && ./gradlew test          # ~93 tests
cd fe && npm run test && npm run build
```

Checklist đầy đủ: [`docs/SHOE_ECOMMERCE_SPECIFICATION.md` §20.4](./docs/SHOE_ECOMMERCE_SPECIFICATION.md#204-checklist-staging--go-live).  
Thanh toán SePay local: [§ SePay + ngrok](#sepay--ngrok-tài-khoản-riêng--dev-local) · [spec §20.10](./docs/SHOE_ECOMMERCE_SPECIFICATION.md#2010-cấu-hình-sepay--ngrok-tài-khoản-riêng).

---

## Stack

- **Backend:** Spring Boot 3.5, Java 17, MongoDB, Redis, SePay, Cloudinary, Resend, OpenAI (AI chat)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4

## Quick start

### Gửi cho người test (một lệnh — Docker full stack + auto seed)

```bash
cp .env.example .env
chmod +x scripts/demo-up.sh
./scripts/demo-up.sh
```

Mở http://localhost:3000 — đăng nhập `customer@sole.test` / `Sole@123`.

Lần **đầu** chạy (MongoDB trống), backend tự seed:
- 12 sản phẩm, brand, category, tồn kho
- 6 tài khoản demo `@sole.test`
- 16 review demo

Chỉ cần infra (BE/FE chạy local, hot reload):

```bash
chmod +x scripts/dev-up.sh
./scripts/dev-up.sh
cd be && ./gradlew bootRun   # seed tự chạy nếu DB trống
cd fe && npm run dev
```

### Dev thủ công

```bash
# Infrastructure (MongoDB, Redis, Redis Commander)
docker compose up -d
```

## Migration scripts (tuỳ chọn)

Chỉ cần khi dọn collection legacy từ dự án cũ — **MongoDB mới không cần chạy**:

```bash
mongosh "$MONGODB_URI" scripts/cleanup-legacy-collections.js
```

## API docs

Swagger UI: `http://localhost:3001/swagger-ui.html`

## Roles

`CUSTOMER`, `STAFF`, `SHOP_MANAGER`, `ADMIN`, `SUPER_ADMIN`

Staff portal: `/staff`

## Environment

Copy `.env.example` to `.env` at the **project root** and fill in secrets.

```bash
cp .env.example .env
```

| Variable | Used by | Notes |
|---|---|---|
| `MONGODB_URI` | Backend | MongoDB connection string (`sole_ecommerce` DB) |
| `JWT_SECRET` | Backend | **Min 32 ký tự** (256-bit) cho JWT HS512 |
| `JWT_ACCESS_EXPIRATION` | Backend | Access token TTL (ms), default `900000` |
| `JWT_REFRESH_EXPIRATION` | Backend | Refresh token TTL (ms), default `604800000` |
| `RESEND_API_KEY` | Backend | [Resend](https://resend.com) API key |
| `RESEND_FROM_EMAIL` | Backend | e.g. `SOLE <onboarding@resend.dev>` |
| `FRONTEND_BASE_URL` | Backend | Payment redirect URL, default `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Backend | Comma-separated FE origins |
| `VITE_API_URL` | Frontend | API host without `/api`, default `http://localhost:3001` |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Same value as `GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth client ID |
| `CLOUDINARY_*` | Backend | Upload ảnh catalog, return, review, refund proof |
| `SEPAY_*` | Backend | Cổng thanh toán — **§ SePay + ngrok** bên dưới & spec §20.10 |
| `OPENAI_API_KEY` | Backend | Trợ lý AI (tuỳ chọn) |
| `CATALOG_SEED_*` | Backend | Seed catalog demo — xem bên dưới |
| `USER_SEED_*` | Backend | Tài khoản demo `@sole.test` |
| `permission.enforcement` | Backend | `true` trên staging/production |

- Backend (`./gradlew bootRun`) loads `../.env` automatically.
- Frontend (`npm run dev`) loads the same root `.env` via Vite `envDir`.

Never commit `.env`. `.env.example` contains placeholders only.

### Demo catalog seed

**Nguồn dữ liệu:** `be/src/main/java/www/config/CatalogSeedService.java`

Lần đầu boot (collection `products` trống), backend tự seed:

- 8 thương hiệu, 6 danh mục
- 12 sản phẩm published + variant + tồn kho
- Ảnh demo: Cloudinary (sản phẩm đã upload) hoặc Unsplash (placeholder)

**Cập nhật ảnh sau khi sửa trên admin:**

```bash
# 1) Export URL hiện tại từ DB → cập nhật CatalogSeedService.java
docker exec sole-mongodb mongosh sole_ecommerce --quiet --file scripts/pull-catalog-seed-from-db.js

# 2) Đồng bộ URL trong scripts/sync-catalog-images-to-db.js rồi chạy:
docker exec -i sole-mongodb mongosh sole_ecommerce --quiet < scripts/sync-catalog-images-to-db.js

# Hoặc restart BE với force refresh (chỉ ghi đè ảnh Unsplash/thiếu — giữ Cloudinary đã upload):
CATALOG_SEED_FORCE=true ./gradlew bootRun
```

**Lưu ý:** Restart BE bình thường (`CATALOG_SEED_FORCE=false`) **không** đụng ảnh đã có. Nếu vừa cập nhật ảnh trên admin/Cloudinary, dùng script sync ở bước 2 thay vì bật `FORCE` với seed file cũ.

Tắt seed: `CATALOG_SEED_ENABLED=false`. Reset DB demo: `docker compose --profile demo down -v`.

### Seed flags (`.env`)

| Variable | Mặc định | Ý nghĩa |
|----------|----------|---------|
| `CATALOG_SEED_ENABLED` | `true` | Seed catalog khi DB trống |
| `CATALOG_SEED_FORCE` | `false` | Refresh ảnh Unsplash/thiếu từ seed — **giữ nguyên Cloudinary** đã upload |
| `REVIEW_SEED_ENABLED` | `true` | Seed review demo |
| `REVIEW_SEED_FORCE` | `false` | Xóa review seed cũ rồi tạo lại |
| `USER_SEED_PASSWORD` | `Sole@123` | Mật khẩu tất cả demo `@sole.test` |

Reset demo hoàn toàn: `docker compose --profile demo down -v` rồi `./scripts/demo-up.sh`.

### Demo user accounts

On startup, missing accounts with email `*@sole.test` are created (password from `USER_SEED_PASSWORD`, default `Sole@123`):

| Email | Role | Use for |
|-------|------|---------|
| `customer@sole.test` | CUSTOMER | Cart, checkout, orders, wishlist |
| `customer2@sole.test` | CUSTOMER | Second customer scenario |
| `staff@sole.test` | STAFF | `/staff` — catalog, inventory, orders |
| `manager@sole.test` | SHOP_MANAGER | Staff portal + product publish |
| `admin@sole.test` | ADMIN | `/admin` — full admin dashboard |
| `superadmin@sole.test` | SUPER_ADMIN | Admin + RBAC permissions |

Disable with `USER_SEED_ENABLED=false`. **Do not use these accounts in production.**

## SePay + ngrok (tài khoản riêng — dev local)

Thanh toán SePay cần **merchant sandbox của bạn** + **ngrok** để nhận IPN webhook trên máy dev. Hướng dẫn đầy đủ: [`docs/SHOE_ECOMMERCE_SPECIFICATION.md` §20.10](./docs/SHOE_ECOMMERCE_SPECIFICATION.md#2010-cấu-hình-sepay--ngrok-tài-khoản-riêng).

### 1. SePay — lấy Merchant ID & Secret Key

1. Đăng ký / đăng nhập [sepay.vn](https://sepay.vn) → **Cổng thanh toán (sandbox)**.
2. Copy **Merchant ID** và **Secret Key** vào `.env`:

```env
SEPAY_MERCHANT_ID=<cua-ban>
SEPAY_SECRET_KEY=<cua-ban>
SEPAY_API_URL=https://pay-sandbox.sepay.vn/v1/checkout/init
SEPAY_ENVIRONMENT=sandbox
SEPAY_IPN_VERIFY=true
FRONTEND_BASE_URL=http://localhost:3000
```

3. Restart backend: `cd be && ./gradlew bootRun`.

### 2. ngrok — tunnel HTTPS → localhost

```bash
brew install ngrok
ngrok config add-authtoken <AUTHTOKEN_NGROK_CUA_BAN>
chmod +x scripts/ngrok-sepay.sh

# Terminal 1: BE đang chạy port 3001
# Terminal 2:
./scripts/ngrok-sepay.sh

# Terminal 3 — copy IPN URL:
./scripts/ngrok-sepay.sh --url
```

### 3. SePay Dashboard — cấu hình IPN

**Cổng thanh toán → Cấu hình → IPN:**

- **URL:** `https://<subdomain>.ngrok-free.app/api/payments/sepay/callback` (từ bước `--url`)
- **Auth:** SECRET_KEY — cùng giá trị với `SEPAY_SECRET_KEY` trong `.env`

### 4. Test

Login `customer@sole.test` → giỏ hàng → checkout → thanh toán SePay sandbox → kiểm tra ngrok http://127.0.0.1:4040 có POST callback **200** → đơn chuyển `PAID`.

**Production:** IPN trỏ domain API thật (HTTPS), đổi `SEPAY_API_URL` + `SEPAY_ENVIRONMENT=production` — không dùng ngrok.

---

## Production / staging (tóm tắt)

Trước go-live, cấu hình tối thiểu:

1. `JWT_SECRET` ≥ 32 ký tự, unique per môi trường
2. `COOKIE_SECURE=true`, `COOKIE_DOMAIN` = domain production
3. `CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL` = URL FE thật
4. `SEPAY_*` production + IPN URL HTTPS (ngrok chỉ dùng dev)
5. `CLOUDINARY_*`, `RESEND_*`, `OPENAI_API_KEY` (nếu bật AI)
6. `USER_SEED_ENABLED=false`, `CATALOG_SEED_ENABLED=false` trên production
7. `SPRING_PROFILES_ACTIVE=prod` (tắt Swagger public)

Checklist chi tiết: [`docs/SHOE_ECOMMERCE_SPECIFICATION.md` §20](./docs/SHOE_ECOMMERCE_SPECIFICATION.md#20-handover--bàn-giao-khách-hàng).
