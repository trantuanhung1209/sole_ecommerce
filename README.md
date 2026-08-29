# SOLE — Shoe E-commerce

Full-stack shoe e-commerce platform.

## Stack

- **Backend:** Spring Boot 3.5, Java 17, MongoDB, Redis, SePay, Cloudinary, Resend
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4

## Quick start

```bash
# Redis
docker compose up -d redis

# Backend
cd be && ./gradlew bootRun

# Frontend
cd fe && npm install && npm run dev
```

## Migration scripts

Optional — only needed if importing data from the old Booking Tour database:

```bash
# Drop legacy tour collections (backup first!)
mongosh "$MONGODB_URI" scripts/cleanup-legacy-collections.js
```

For a **fresh MongoDB cluster**, no migration scripts are required.

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

- Backend (`./gradlew bootRun`) loads `../.env` automatically.
- Frontend (`npm run dev`) loads the same root `.env` via Vite `envDir`.

Never commit `.env`. `.env.example` contains placeholders only.

### Demo catalog seed

On first boot with an **empty** products collection, the backend auto-seeds:

- 8 brands (Nike, Adidas, Jordan, …)
- 6 categories (Running, Lifestyle, …)
- 12 published products with variants, prices, and inventory

Disable with `CATALOG_SEED_ENABLED=false` in `.env`. To re-seed, clear the `products` collection in MongoDB and restart.

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
