# Đặc tả hệ thống SOLE — E-commerce giày dép

> **Phiên bản tài liệu:** cập nhật sau giai đoạn triển khai P0–P6 và rà soát gap audit (2026).  
> **Trạng thái hệ thống:** MVP+ (~85%) — luồng mua hàng end-to-end hoạt động; còn một số hạng mục spec cố ý hoãn hoặc chưa polish.

---

## Mục lục

1. [Tổng quan sản phẩm](#1-tổng-quan-sản-phẩm)
2. [Vai trò và phân quyền](#2-vai-trò-và-phân-quyền)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
5. [Mô hình dữ liệu cốt lõi](#5-mô-hình-dữ-liệu-cốt-lõi)
6. [Trạng thái triển khai theo module](#6-trạng-thái-triển-khai-theo-module)
7. [Đặc tả API](#7-đặc-tả-api)
8. [Luồng nghiệp vụ chính](#8-luồng-nghiệp-vụ-chính)
9. [Quy tắc giá, vận chuyển, tồn kho](#9-quy-tắc-giá-vận-chuyển-tồn-kho)
10. [Yêu cầu bảo mật](#10-yêu-cầu-bảo-mật)
11. [Giao diện người dùng (Frontend)](#11-giao-diện-người-dùng-frontend)
12. [Quản trị Admin / Staff](#12-quản-trị-admin--staff)
13. [Thông báo và email](#13-thông-báo-và-email)
14. [Tìm kiếm và lọc sản phẩm](#14-tìm-kiếm-và-lọc-sản-phẩm)
15. [Trợ lý AI mua sắm](#15-trợ-lý-ai-mua-sắm)
16. [Chiến lược kiểm thử](#16-chiến-lược-kiểm-thử)
17. [Biến môi trường](#17-biến-môi-trường)
18. [Phạm vi chưa triển khai / hoãn](#18-phạm-vi-chưa-triển-khai--hoãn)
19. [Tiêu chí hoàn thành (Definition of Done)](#19-tiêu-chí-hoàn-thành-definition-of-done)

**Chú thích trạng thái trong tài liệu:**

| Ký hiệu | Ý nghĩa |
|--------|---------|
| ✅ | Đã triển khai, dùng được trong MVP |
| ⚠️ | Đã triển khai một phần / cần polish |
| ❌ | Chưa triển khai hoặc cố ý hoãn |

---

## 1. Tổng quan sản phẩm

### 1.1. Mô tả

**SOLE** là website e-commerce bán giày dép, cho phép:

- Khách xem, tìm kiếm, lọc sản phẩm theo thương hiệu, danh mục, size, màu, giá, giới tính, tình trạng còn hàng.
- Chọn biến thể (variant) theo size/màu/SKU, thêm giỏ hàng, thanh toán qua **SePay**, theo dõi đơn hàng.
- Đánh giá sản phẩm (verified purchase), yêu cầu đổi/trả/hoàn tiền trong cửa sổ 7 ngày sau giao hàng.
- Admin/Staff quản lý catalog, duyệt sản phẩm, tồn kho, đơn hàng, đổi/trả, đánh giá, báo cáo và ma trận phân quyền.

### 1.2. Mục tiêu

- Khách mua giày nhanh, rõ size/màu/còn hàng.
- Giảm oversell nhờ **reserve tồn kho** trước khi tạo đơn.
- Webhook thanh toán **an toàn, idempotent**.
- Cổng admin/staff vận hành catalog — inventory — order — return.
- Nền tảng mở rộng được cho promotion, vận chuyển, AI assistant (một phần đã có).

### 1.3. Ngoài phạm vi MVP hiện tại

- Marketplace nhiều nhà bán.
- Đa tiền tệ.
- Loyalty point phức tạp.
- Tích hợp ERP/WMS.
- Hoàn tiền SePay tự động qua API gateway.

---

## 2. Vai trò và phân quyền

### 2.1. Bảng vai trò

| Vai trò | Mô tả | Quyền chính |
|--------|-------|-------------|
| **GUEST** | Chưa đăng nhập | Xem sản phẩm, tìm kiếm/lọc, xem đánh giá công khai |
| **CUSTOMER** | Khách hàng | Giỏ hàng, checkout, đơn hàng, địa chỉ, đánh giá, wishlist, yêu cầu trả hàng |
| **STAFF** | Nhân viên | Xử lý đơn, hỗ trợ KH, tạo/sửa sản phẩm draft, xác nhận/trả hàng bước đầu |
| **SHOP_MANAGER** | Quản lý shop | Duyệt sản phẩm, quản lý tồn kho, duyệt hoàn tiền/trả hàng, xem báo cáo |
| **ADMIN** | Quản trị | Quản lý user, cấu hình, toàn quyền admin (trừ RBAC matrix) |
| **SUPER_ADMIN** | Chủ hệ thống | Mọi quyền + sửa ma trận phân quyền trên UI |

### 2.2. Ma trận quyền thực tế (MVP+)

| Chức năng | Guest | Customer | Staff | Shop Manager | Admin |
|-----------|:-----:|:--------:|:-----:|:------------:|:-----:|
| Duyệt & lọc sản phẩm | ✅ | ✅ | ✅ | ✅ | ✅ |
| Thêm giỏ hàng | ❌* | ✅ | ✅ | ✅ | ✅ |
| Checkout SePay | ❌ | ✅ | ✅ | ✅ | ✅ |
| Xem đơn/review/return của mình | ❌ | ✅ | ✅ | ✅ | ✅ |
| Duyệt sản phẩm | — | — | ❌ | ✅ | ✅ |
| Xử lý return/refund | — | Yêu cầu | Xác nhận | Duyệt/hoàn | ✅ |
| Ma trận RBAC UI | — | — | — | — | SUPER_ADMIN |
| Báo cáo doanh thu | — | — | Hạn chế FE | ✅ | ✅ |

\* *Guest:* giỏ hàng và checkout **bắt buộc đăng nhập**. Header hiển thị link giỏ hàng kèm gợi ý «(đăng nhập)» và chuyển tới `/login?redirect=/cart`.

### 2.3. RBAC động (Dynamic RBAC) — ✅

**Cách hoạt động:**

1. Backend seed danh sách permission (`CATALOG_CREATE`, `INVENTORY_UPDATE`, …) và gán mặc định theo role trong `RbacService`.
2. `SUPER_ADMIN` chỉnh ma trận trên **Admin → Vai trò & quyền hạn** (`RolePermissionsPage`).
3. Mỗi lần lưu bắt buộc **lý do**; backend ghi **audit log**; cache Redis được invalidate.
4. API `/auth/me` trả về `permissions[]` — frontend `useRoleAccess` đọc mảng này để gate menu/nút.
5. Backend dùng `@perm.has(authentication, 'PERMISSION_CODE')` trên các API nhạy cảm (catalog create/update, inventory adjust, return approve/refund, reports).

**Quy tắc an toàn:**

- Chỉ `SUPER_ADMIN` được cập nhật ma trận.
- Không được tắt `MANAGE_ROLE_PERMISSIONS` của `SUPER_ADMIN`.
- Không xóa role hệ thống: `CUSTOMER`, `STAFF`, `SHOP_MANAGER`, `ADMIN`, `SUPER_ADMIN`.
- `permission.enforcement=false` (env) tắt toàn bộ evaluator — chỉ dùng khi dev.

**Danh sách permission:**

```text
CATALOG_READ, CATALOG_CREATE, CATALOG_UPDATE, CATALOG_DELETE, CATALOG_APPROVE
INVENTORY_READ, INVENTORY_UPDATE
ORDER_READ, ORDER_UPDATE, ORDER_CANCEL
PAYMENT_READ, PAYMENT_REFUND
RETURN_READ, RETURN_PROCESS
REVIEW_MODERATE
USER_READ, USER_UPDATE, USER_DISABLE
REPORT_READ, SYSTEM_SETTINGS
MANAGE_ROLE_PERMISSIONS, AUDIT_LOG_READ
```

---

## 3. Công nghệ sử dụng

### 3.1. Backend — ✅

| Thành phần | Công nghệ |
|-----------|-----------|
| Runtime | Java 17 |
| Framework | Spring Boot, Spring Web, Spring Security |
| Database | MongoDB (Spring Data MongoDB) |
| Cache / Session | Redis |
| Build | Gradle |
| Media | Cloudinary |
| Thanh toán | SePay (sandbox/production qua env) |
| Email | Thymeleaf templates |
| Tìm kiếm (tùy chọn) | Elasticsearch 8.x (fallback Mongo) |
| AI | OpenAI API (server-side) |

### 3.2. Frontend — ✅

| Thành phần | Công nghệ |
|-----------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| State | Redux Toolkit (auth) |
| HTTP | Axios (credentials + CSRF) |
| Form | React Hook Form + Zod |
| UI kit | Tailwind CSS + shadcn/Radix |
| Toast | React Toastify |
| Test | Vitest |

### 3.3. Cần bổ sung / cải thiện — ⚠️

- OpenAPI/Swagger UI expose và verify.
- Testcontainers / E2E integration tests.
- Correlation ID logging toàn cục.

---

## 4. Kiến trúc hệ thống

### 4.1. Backend — modular monolith

```text
be/src/main/java/www/
  config/           # Security, CORS, Redis, Mongo
  security/         # JWT filter, CSRF, rate limit, SolePermissionEvaluator
  controller/       # AuthController
  modules/
    catalog/        # Sản phẩm, brand, category, variant
    inventory/      # Tồn kho, reservation
    cart/
    checkout/
    orders/
    payments/       # SePay, IPN verify
    reviews/
    returns/
    wishlist/
    addresses/
    notifications/  # In-app + SSE stream
    rbac/
    reports/
    search/         # ES + Mongo router
    ai/
  service/          # Mail, shared services
```

Mỗi module: `controller/`, `service/`, `repository/`, `dto/`, `model/`.

### 4.2. Frontend — feature-based

```text
fe/src/
  pages/
    Public/Home/
    ecommerce/      # Listing, PDP, cart, checkout, orders, returns, AI chat, notifications
    admin/          # Dashboard, products, inventory, orders, returns, RBAC
    staff/          # Dashboard queues
    auth/
    payment/        # Success / error / cancel
  services/         # ecommerceServices, notificationServices, userServices
  config/roleAccess.ts
  hooks/useRoleAccess.ts
  routes/           # ProtectedRoute, AuthRoute, RoleGate
```

---

## 5. Mô hình dữ liệu cốt lõi

### 5.1. Product (sản phẩm cha)

Ví dụ: «Nike Air Force 1».

```text
productId, name, slug, description, brandId, categoryIds[]
genderTarget: MEN | WOMEN | UNISEX | KIDS
status: DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | PUBLISHED | UNPUBLISHED
publicStatus: DRAFT | PUBLISHED | HIDDEN
createdBy, approvedBy, approvedAt, rejectionReason, deleted, timestamps
```

**Workflow duyệt:** Staff tạo `DRAFT` → gửi duyệt → Shop Manager/Admin `approve` → `publish` → hiển thị storefront.

### 5.2. Product Variant (biến thể)

```text
variantId, productId, sku, size, colorName, colorHex
price, compareAtPrice, weight, status: ACTIVE | INACTIVE, imageUrls[]
```

### 5.3. Inventory (tồn kho)

Một kho mặc định `warehouseId = "default"`.

```text
inventoryId, variantId, warehouseId
onHand, reserved, sold, available, updatedAt

Quy tắc: available = onHand - reserved - sold
```

### 5.4. Stock Reservation

Giữ hàng tạm khi checkout (TTL ~15 phút).

```text
reservationId, orderId, variantId, quantity
status: ACTIVE | CONFIRMED | RELEASED | EXPIRED
expiresAt, timestamps
```

### 5.5. Cart & Cart Item

Giỏ theo `userId` (một user một giỏ ACTIVE).

```text
cartItemId, variantId, quantity, priceSnapshot
```

### 5.6. Order & Order Item

Order snapshot địa chỉ và từng dòng hàng tại thời điểm mua.

**Trạng thái đơn:** `PENDING_PAYMENT` → `PAID`/`CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` → `COMPLETED`  
**Hủy / trả:** `CANCELLED`, `RETURN_REQUESTED`, `REFUNDED`

**Trạng thái thanh toán:** `PENDING`, `COMPLETED`, `FAILED`, `EXPIRED`, `REFUNDED`

### 5.7. Payment & Payment Event

- Mỗi checkout tạo `EcommercePayment` với `orderInvoiceNumber` unique.
- `PaymentEvent` lưu raw IPN; unique `(gateway, transactionId)` đảm bảo idempotent.

### 5.8. Return Request (RMA)

```text
returnRequestId, orderId, orderItemId, userId, reason, customerNote, imageUrls[]
status: PENDING | STAFF_CONFIRMED | APPROVED | REJECTED | RECEIVED | REFUNDED | CLOSED
refundAmount, manualRefundRequired, staffNote, managerNote, rejectedReason
```

### 5.9. Review, Wishlist, Address, Notification

- **Review:** gắn `orderId` + `orderItemId`; verified purchase; vote dedupe phía BE.
- **Wishlist:** `userId` + `productId` unique.
- **Address:** sổ địa chỉ giao hàng; một địa chỉ `isDefault`.
- **Notification:** in-app + SSE; `targetUrl` deep link.

---

## 6. Trạng thái triển khai theo module

Phần này mô tả **cách từng chức năng hoạt động thực tế** trong codebase hiện tại.

### 6.1. Xác thực & phiên (Auth) — ✅

| Chức năng | Cách hoạt động |
|-----------|----------------|
| Đăng ký + OTP email | `POST /auth/register` → gửi OTP → `POST /auth/verify-otp` kích hoạt tài khoản |
| Đăng nhập | JWT access + refresh trong **HttpOnly cookie**; access ngắn hạn, refresh dài hạn |
| Refresh / Logout | `POST /auth/refresh`, `POST /auth/logout`; logout blacklist token |
| Google OAuth | `POST /auth/google` — liên kết hoặc tạo user |
| Quên / đổi mật khẩu | OTP qua email; `forgot-password`, `reset-password`, `change-password` |
| Profile | `GET/PUT /auth/me`, `/auth/profile` — `/auth/me` trả `permissions[]` |
| Quản lý phiên | Redis lưu session; `GET /auth/sessions`, revoke từng/thu hồi tất cả |
| Cookie refresh | Tên cookie: `refresh_token`; backend nhận cả legacy `refreshToken` khi đánh dấu phiên «hiện tại» |

**Frontend:** `ProtectedRoute` chặn route cần login; `AuthRoute` chuyển user đã login về trang chủ.

### 6.2. Catalog (Danh mục sản phẩm) — ✅ / ⚠️

| Chức năng | Trạng thái | Cách hoạt động |
|-----------|:----------:|----------------|
| Listing + filter | ✅ | `GET /products` — brand, category, gender, price, size, color, inStock, sort; URL sync trên FE |
| Chi tiết sản phẩm | ✅ | Slug hoặc ID; variants công khai kèm `available` |
| Buy now | ✅ | PDP → checkout trực tiếp |
| Sản phẩm liên quan | ✅ | `GET /products/{id}/related` |
| Category theo slug | ✅ | `/categories/:slug` |
| Admin CRUD product/variant | ✅ | Workflow approve/publish/unpublish |
| Brand/Category admin | ⚠️ | BE đủ CRUD; FE admin **chỉ create**, chưa update/delete UI |
| Soft delete / restore | ⚠️ | BE có; FE admin chưa expose |

### 6.3. Tồn kho (Inventory) — ✅

| Chức năng | Cách hoạt động |
|-----------|----------------|
| Reserve khi checkout | Atomic Mongo update: `available -= qty`, `reserved += qty`; tạo `StockReservation` ACTIVE, TTL 15 phút |
| Xác nhận khi thanh toán | IPN success → `confirmOrderReservations`: `reserved → sold` |
| Hủy / hết hạn | Release reservation → trả `available` |
| Điều chỉnh thủ công | Admin `PUT /admin/inventory/{variantId}/adjust` — re-index ES product |
| Import CSV | Admin `POST /admin/inventory/import` — FE có textarea `variantId,quantity` |
| Restock khi trả hàng | Return `RECEIVED` → `InventoryService.restock()` — giảm `sold`, tăng `onHand`/`available` |
| Scheduler | Job expire reservation + expire payment pending |

### 6.4. Giỏ hàng (Cart) — ✅ / ⚠️

| Chức năng | Trạng thái | Cách hoạt động |
|-----------|:----------:|----------------|
| CRUD giỏ | ✅ | Theo `userId`; merge quantity cùng variant |
| Validate | ✅ | `POST /cart/validate` — kiểm stock, giá, variant active |
| Re-validate sau đổi qty | ⚠️ | Cần user refresh/tải lại; chưa auto re-run ngay sau mỗi lần đổi số lượng |
| Guest cart | ❌ | Bắt buộc login |

### 6.5. Checkout — ✅ / ⚠️

**Luồng `/checkout`:**

1. Load giỏ từ DB, validate từng item.
2. Snapshot địa chỉ từ `addressId`.
3. Tính phí ship (`ShippingFeeCalculator`: 30.000đ; **miễn phí từ 2.000.000đ**).
4. **Reserve tồn kho** cho toàn bộ dòng hàng.
5. Tạo order `PENDING_PAYMENT` + payment `PENDING` (hết hạn ~15 phút).
6. Trả `PaymentCheckoutResponse` — FE auto-submit form SePay.

| Hạng mục | Trạng thái |
|----------|:----------:|
| Preview (`POST /checkout/preview`) | ✅ |
| addressId snapshot | ✅ |
| customerNote | ⚠️ API hỗ trợ; FE checkout có thể chưa có input |
| Phương thức thanh toán | ⚠️ Hard-code `SEPAY` |
| VAT (`taxTotal`) | ❌ Luôn 0 |

### 6.6. Thanh toán SePay — ✅

| Chức năng | Cách hoạt động |
|-----------|----------------|
| Tạo payment | Form POST tới SePay với `merchant`, `order_invoice_number`, amount, callback URLs |
| IPN POST | `POST /payments/sepay/callback` — `SePayIpnVerifier` verify chữ ký → `handleCallback` |
| Idempotent | Duplicate `transactionId` → bỏ qua, trả success |
| Amount check | So khớp `order_amount` với payment trong DB |
| Success | Payment `COMPLETED`, order `markPaid`, confirm reservation, email/notification |
| Failed | Payment `FAILED`, hủy order, release reservation, **email + notification** |
| Expired (job) | `expirePendingPayments` — hủy order, **email + notification** |
| Tra cứu payment | `GET /payments/order/{orderId}` — **kiểm tra ownership** (chống IDOR) |
| Trang success FE | Poll BE tối đa ~12s; không hiển thị «thành công» giả khi IPN chưa về |
| Generic callback | Chỉ `ADMIN`/`SUPER_ADMIN` — không public |

### 6.7. Đơn hàng (Orders) — ✅ / ⚠️

| Chức năng | Trạng thái | Cách hoạt động |
|-----------|:----------:|----------------|
| Lịch sử / chi tiết KH | ✅ | `GET /orders/my-orders`, `/orders/{id}` — ownership check |
| Hủy đơn | ✅ | Trước khi ship; release reservation nếu cần |
| Admin list + đổi trạng thái | ✅ | Advance status; ship kèm `trackingCode` |
| Admin order detail page | ⚠️ | Chỉ list + modal/prompt, chưa có trang chi tiết riêng |
| Email vận chuyển | ✅ | Shipped, delivered templates |

### 6.8. Đổi / trả / hoàn tiền (Returns) — ✅ / ⚠️

**Workflow thực tế:**

```text
PENDING
  → STAFF_CONFIRMED (Staff xác nhận) hoặc REJECTED
  → APPROVED (Manager duyệt trả)
  → RECEIVED (Staff xác nhận đã nhận hàng → restock tồn kho)
  → REFUNDED (Manager hoàn tiền → manualRefundRequired nếu cần SePay thủ công)
```

| Hạng mục | Trạng thái |
|----------|:----------:|
| Cửa sổ 7 ngày sau `deliveredAt` | ✅ |
| Upload ảnh minh chứng | ✅ |
| Admin workflow từng bước | ✅ |
| Hoàn tiền SePay API | ❌ `manualRefundRequired=true` |
| Restock | ✅ Khi `RECEIVED` |
| FE customer MyReturns | ⚠️ Hiển thị orderId thô |

### 6.9. Đánh giá (Reviews) — ✅ / ⚠️

- Chỉ tạo được khi order item thuộc đơn `DELIVERED`/`COMPLETED`, mỗi item một review.
- Admin: reply, ẩn/hiện review.
- ⚠️ FE chưa vote «helpful»; My Reviews read-only.

### 6.10. Wishlist & Địa chỉ — ✅ / ⚠️

- Wishlist: add/remove/list — ⚠️ empty state / N+1 fetch product chưa tối ưu.
- Address: CRUD BE đủ — ⚠️ FE address book chủ yếu create; thiếu ward/district đầy đủ trên form.

### 6.11. Thông báo — ✅

- Bell dropdown (8 mục gần nhất) + SSE stream realtime.
- Trang đầy đủ `/notifications` — phân trang, đánh dấu đã đọc.
- Deep link qua `targetUrl`.

### 6.12. Báo cáo (Reports) — ✅

- `GET /admin/reports/dashboard?from=&to=` — tổng đơn, doanh thu, user, sản phẩm, low stock, return pending.
- FE Dashboard Admin gọi API này (không còn filter client-side trên 500 đơn cho stats chính).
- Charts vẫn dùng subset orders cho biểu đồ.

### 6.13. Tìm kiếm — ✅ / ⚠️

- Mặc định `SEARCH_ENGINE=mongo` — regex/text filter đầy đủ.
- Elasticsearch (tùy chọn): nested filter size/color/price/inStock; timeout → fallback Mongo.
- Re-index khi publish/unpublish/adjust/restock; ⚠️ review rating chưa trigger re-index.
- Admin re-index: API `POST /admin/search/reindex` — chưa có UI.

### 6.14. Trợ lý AI — ✅ / ⚠️

- BE: `POST /ai/chat` — router keyword, OpenAI adapter, lưu conversation MongoDB.
- FE: `/ai-chat` — widget chat; guest được gọi API nhưng FE yêu cầu login.
- ⚠️ Route `ORDER_STATUS` chưa tra order thật; semantic search/embedding chưa dùng.

---

## 7. Đặc tả API

**Base URL:** `/api` (hoặc theo `SERVER_PORT` / proxy FE)

**Response chuẩn:**

```json
{
  "status": 200,
  "message": "Success",
  "data": {}
}
```

**Phân trang:**

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "first": true,
  "last": false,
  "empty": false
}
```

### 7.1. Auth

```text
POST   /auth/register
POST   /auth/verify-otp
POST   /auth/login
POST   /auth/google
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me                    # trả permissions[]
PUT    /auth/profile
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/change-password
GET    /auth/sessions
DELETE /auth/sessions/{sessionId}
DELETE /auth/sessions
```

### 7.2. RBAC (SUPER_ADMIN)

```text
GET  /admin/roles
GET  /admin/permissions
GET  /admin/roles/{roleCode}/permissions
PUT  /admin/roles/{roleCode}/permissions
GET  /admin/role-permissions/matrix
PUT  /admin/role-permissions/matrix
GET  /admin/audit-logs
```

### 7.3. Catalog

**Public:**

```text
GET /products
GET /products/search
GET /products/{idOrSlug}
GET /products/{productId}/variants
GET /products/{productId}/related
GET /brands
GET /categories
```

**Admin:**

```text
GET/POST/PUT/DELETE /admin/products/...
POST /admin/products/{id}/approve|reject|publish|unpublish
POST/PUT/DELETE     /admin/products/{id}/variants/...
POST                /admin/categories, /admin/brands
```

### 7.4. Inventory

```text
GET  /admin/inventory
GET  /admin/inventory/low-stock
GET  /admin/inventory/{variantId}
PUT  /admin/inventory/{variantId}/adjust      # @perm INVENTORY_UPDATE
POST /admin/inventory/import
```

### 7.5. Cart & Checkout

```text
GET/DELETE /cart
POST/PUT/DELETE /cart/items/...
POST       /cart/validate
POST       /checkout/preview
POST       /checkout
```

### 7.6. Orders

```text
GET  /orders/my-orders
GET  /orders/{orderId}
POST /orders/{orderId}/cancel
GET  /admin/orders
PUT  /admin/orders/{orderId}/status
POST /admin/orders/{orderId}/ship
```

### 7.7. Payments

```text
GET  /payments/order/{orderId}     # authenticated + ownership
GET  /payments/{paymentId}         # authenticated + ownership
POST /payments/sepay/callback      # public IPN
GET  /payments/sepay/callback      # browser redirect only, no mutate
POST /payments/reconcile           # ADMIN — expire pending
POST /payments/callback            # ADMIN — generic test callback
```

### 7.8. Reviews, Wishlist, Returns, Addresses

```text
GET/POST /reviews/...
GET/POST/DELETE /wishlist/...
POST/GET /returns/...
GET/POST/PUT/DELETE /addresses/...
```

**Return admin:**

```text
POST /admin/returns/{id}/staff-confirm
POST /admin/returns/{id}/reject
POST /admin/returns/{id}/approve
POST /admin/returns/{id}/mark-received
POST /admin/returns/{id}/refund
```

### 7.9. Notifications, Reports, AI, Search

```text
GET/PUT  /notifications/...
GET      /notifications/stream      # SSE
GET      /admin/reports/dashboard
POST     /ai/chat
GET      /ai/conversations/...
POST     /admin/search/reindex
```

---

## 8. Luồng nghiệp vụ chính

### 8.1. Duyệt và lọc sản phẩm

```text
User → Trang listing (/products)
     → Filter drawer (brand, category, gender, size, color, giá, còn hàng)
     → Sync query params URL (share link)
     → Backend: Mongo hoặc ES (nested variants)
     → PDP: chọn size/màu → hiển thị stock variant
     → Add to cart / Buy now (yêu cầu login)
```

### 8.2. Thêm giỏ hàng

```text
Customer chọn variant + quantity
→ POST /cart/items
→ BE kiểm variant ACTIVE, available > 0
→ Merge hoặc thêm dòng mới
→ Trả cart summary
```

### 8.3. Checkout

```text
Customer mở /checkout
→ Chọn địa chỉ (addressId)
→ POST /checkout/preview (optional — xem phí ship)
→ POST /checkout
→ BE validate giỏ + stock
→ Reserve tồn kho (TTL)
→ Tạo order PENDING_PAYMENT + payment PENDING
→ FE SePayRedirectForm auto POST sang SePay
```

### 8.4. Thanh toán thành công (IPN)

```text
SePay POST IPN
→ Verify signature (SePayIpnVerifier)
→ Lưu PaymentEvent (unique transactionId)
→ Duplicate? → return success ngay
→ Validate amount
→ Payment COMPLETED, order markPaid
→ Confirm reservation (sold++)
→ Email xác nhận + notification
→ User redirect /payment/success → FE poll BE xác nhận
```

### 8.5. Thanh toán thất bại / hết hạn

```text
IPN failed HOẶC scheduler expirePendingPayments
→ Payment FAILED/EXPIRED
→ Order CANCELLED
→ Release reservation
→ Email failed/expired + notification
```

### 8.6. Fulfillment (vận hành đơn)

```text
PAID/CONFIRMED → PROCESSING → SHIPPED (trackingCode) → DELIVERED → COMPLETED
Mỗi bước: admin/staff cập nhật status; email shipped/delivered tương ứng
```

### 8.7. Đổi / trả / hoàn tiền

```text
Customer (đơn DELIVERED, trong 7 ngày)
→ POST /returns { orderId, orderItemId, reason, images }
→ Staff: staff-confirm / reject
→ Manager: approve
→ Staff: mark-received → restock inventory
→ Manager: refund → payment REFUNDED local, manualRefundRequired nếu cần hoàn SePay thủ công
```

---

## 9. Quy tắc giá, vận chuyển, tồn kho

### 9.1. Giá

- Giá hiển thị lấy từ **variant**; order item snapshot `unitPrice`, `lineTotal`.
- **Không tin** số tiền từ client khi checkout.
- Voucher / khuyến mãi: ❌ chưa có module `promotions/`.

### 9.2. Phí vận chuyển — ✅

| Quy tắc | Giá trị |
|---------|---------|
| Phí cố định | 30.000 VND |
| Miễn phí | Subtotal ≥ 2.000.000 VND |
| Tính toán | `ShippingFeeCalculator` (BE); FE cart hiển thị message tương ứng |

### 9.3. Tồn kho — không oversell — ✅

**Reserve (checkout):**

```text
if available >= quantity:
  reserved += quantity; available -= quantity
  tạo reservation ACTIVE (expiresAt = now + 15 phút)
else: reject checkout
```

**Thanh toán thành công:**

```text
reservation ACTIVE → CONFIRMED
reserved -= quantity; sold += quantity
```

**Thất bại / hết hạn:**

```text
reservation → RELEASED/EXPIRED
reserved -= quantity; available += quantity
```

**Trả hàng đã nhận:**

```text
sold -= quantity; onHand += quantity; available recalc
```

Cập nhật atomic qua MongoTemplate (`updateFirst` với điều kiện `available >= qty`).

---

## 10. Yêu cầu bảo mật

### 10.1. Xác thực — ✅

- Access token + refresh token: HttpOnly cookie.
- Session refresh lưu Redis; hỗ trợ revoke đa thiết bị.
- Logout blacklist access token.

### 10.2. CSRF — ✅

- Cookie auth → POST/PUT/PATCH/DELETE yêu cầu CSRF token.
- `SpaCsrfTokenRequestHandler` cho SPA; SePay IPN exempt.

### 10.3. Rate limiting — ✅

- Login, register, OTP, forgot password, checkout — `RateLimitFilter`.

### 10.4. Thanh toán — ✅

- Verify chữ ký SePay IPN.
- Idempotency qua `PaymentEvent`.
- Không cập nhật payment từ trang success FE trực tiếp.
- Tra cứu payment có **ownership check**.

### 10.5. Upload — ✅

- Cloudinary; validate MIME/size; thư mục riêng catalog/review/avatar.

---

## 11. Giao diện người dùng (Frontend)

### 11.1. Trang công khai — ✅

| Route | Mô tả |
|-------|-------|
| `/` | Home — banner, danh mục nổi bật |
| `/products` | Listing + filter drawer + URL sync |
| `/categories/:slug` | Sản phẩm theo danh mục |
| `/products/:idOrSlug` | PDP — gallery, variant, stock, buy now, related, reviews |
| `/login`, `/register`, `/forgot-password` | Auth |

### 11.2. Trang khách hàng (cần login) — ✅

| Route | Mô tả |
|-------|-------|
| `/cart` | Giỏ — validate, phí ship từ API |
| `/checkout` | Chọn địa chỉ, preview, submit SePay |
| `/payment/success\|error\|cancel` | Kết quả thanh toán — success poll BE |
| `/orders`, `/orders/:id` | Lịch sử, chi tiết, hủy, review, return |
| `/returns` | Yêu cầu trả của tôi |
| `/reviews` | Đánh giá của tôi |
| `/wishlist` | Danh sách yêu thích |
| `/addresses` | Sổ địa chỉ |
| `/profile` | Hồ sơ + panel phiên đăng nhập |
| `/notifications` | Thông báo đầy đủ |
| `/ai-chat` | Trợ lý AI |

### 11.3. Admin / Staff — ✅

| Route | Mô tả |
|-------|-------|
| `/admin` | Dashboard — stats từ reports API, charts, export Excel |
| `/admin/products` | CRUD, approve, publish |
| `/admin/inventory` | Tồn kho, adjust, import CSV |
| `/admin/orders` | Quản lý đơn, ship + tracking |
| `/admin/returns` | Workflow return từng bước |
| `/admin/reviews` | Kiểm duyệt |
| `/admin/role-permissions` | Ma trận RBAC (SUPER_ADMIN) |
| `/staff` | Dashboard hàng đợi staff |

**Phân quyền FE:** `useRoleAccess` + `roleAccess.ts` — kết hợp role và `permissions[]`.

---

## 12. Quản trị Admin / Staff

### 12.1. Sản phẩm

```text
DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED
Từ chối: REJECTED (kèm lý do)
Không hard-delete nếu đã có order item (soft delete)
```

### 12.2. Tồn kho

- Xem theo variant: onHand / reserved / available / sold.
- Lọc LOW / OUT of stock.
- Import CSV: `variantId,quantity` mỗi dòng.

### 12.3. Return admin

UI nút theo trạng thái:

- `PENDING`: Xác nhận / Từ chối
- `STAFF_CONFIRMED`: Duyệt trả hàng
- `APPROVED`: Đã nhận hàng
- `RECEIVED`: Hoàn tiền

### 12.4. RBAC UI — ✅

- Lọc theo nhóm permission.
- Bắt buộc lý do khi lưu.
- Nút Hoàn tác (reset draft).
- Xem audit log 100 bản ghi gần nhất.

---

## 13. Thông báo và email

### 13.1. Email templates — ✅

| Template | Kích hoạt |
|----------|-----------|
| OTP xác thực | Register |
| Reset password | Forgot password |
| Xác nhận đơn | Order paid |
| Thanh toán thất bại | IPN failed |
| Thanh toán hết hạn | Scheduler expire |
| Đã giao / Đã nhận | Admin ship / deliver |
| Return approved/rejected | Return workflow |
| Refund completed | Return REFUNDED |

### 13.2. In-app notification — ✅

```text
notificationId, userId, type, title, message, targetUrl, read, createdAt
```

SSE `/notifications/stream` push realtime tới bell icon.

---

## 14. Tìm kiếm và lọc sản phẩm

### 14.1. Mongo (mặc định) — ✅

Filter: keyword, brandId, categoryId, gender, min/max price, size, color, inStock, sort (newest, price, rating).

### 14.2. Elasticsearch (tùy chọn) — ✅ / ⚠️

- Bật: `SEARCH_ENGINE=elasticsearch` + Docker ES.
- Index `ProductDocument` với nested `variants[]` (size, color, price, available).
- Filter phức tạp dùng nested query.
- Timeout → fallback Mongo tự động (`ProductSearchRouter`).
- Re-index: publish/unpublish, adjust, restock; API admin reindex.

### 14.3. Semantic / vector search — ❌

- `OPENAI_EMBEDDING_MODEL` có placeholder env; chưa tích hợp luồng search.

---

## 15. Trợ lý AI mua sắm

### 15.1. Kiến trúc — ✅

```text
FE /ai-chat
  → POST /api/ai/chat (OpenAI key chỉ ở BE)
  → AiRouterService phân loại intent (keyword)
  → ProductContextService lấy context catalog (nếu cần)
  → OpenAiChatAdapter gọi OpenAI
  → Lưu AiConversation / messages MongoDB
  → Trả answer + conversationId
```

### 15.2. Intent routes

```text
PRODUCT_INFO | SIZE_ADVICE | ORDER_STATUS | PAYMENT_REFUND_POLICY
RETURN_POLICY | CHITCHAT | WEBSEARCH
```

⚠️ `ORDER_STATUS` chưa truy vấn order thật của user.

### 15.3. Giới hạn prompt

- Chỉ tư vấn trong phạm vi giày dép / e-commerce SOLE.
- Không tự xác nhận thanh toán hay hoàn tiền — hướng user tới UI/API.
- Guest: BE gán `userId = "guest"`; FE khuyến khích login.

---

## 16. Chiến lược kiểm thử

### 16.1. Đã có — ⚠️

| Layer | Tests |
|-------|-------|
| BE | `EcommercePaymentServiceTest` (IPN idempotent, amount mismatch, expire + mail) |
| BE | `OrderMailNotifierTest` |
| FE | `commerce.test.ts` — 10 tests (roleAccess, shipping, payment state, CSV parse) |

### 16.2. Cần bổ sung — ❌

- Integration: checkout concurrent, webhook duplicate, reservation expiry E2E.
- Security: CSRF, rate limit, ownership IDOR regression.
- FE: cart validate flow, checkout, protected routes (RTL/Vitest hoặc Playwright).

---

## 17. Biến môi trường

### 17.1. Backend

```text
SERVER_PORT
MONGODB_URI
REDIS_HOST, REDIS_PORT
JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION
COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAME_SITE
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SEPAY_API_URL, SEPAY_MERCHANT_ID, SEPAY_SECRET_KEY
FRONTEND_BASE_URL
SEARCH_ENGINE=mongo|elasticsearch
ELASTICSEARCH_URI, SEARCH_INDEX_NAME, SEARCH_TIMEOUT_MS
OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL, OPENAI_TIMEOUT_MS
permission.enforcement=true
FREE_SHIPPING_THRESHOLD=2000000
SHIPPING_FEE=30000
```

### 17.2. Frontend

```text
VITE_API_URL
VITE_GOOGLE_CLIENT_ID
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

---

## 18. Phạm vi chưa triển khai / hoãn

| Hạng mục | Ghi chú |
|----------|---------|
| Guest cart / guest checkout | Cố ý login-required; có CTA login |
| Voucher / coupon / promotion | Không có module |
| COD / VNPAY / MoMo | Chỉ SePay |
| VAT (`taxTotal`) | Luôn 0 |
| Hoàn tiền SePay tự động | Manual + flag `manualRefundRequired` |
| Partial refund | Enum có, chưa flow |
| Abandoned cart recovery | Enum `ABANDONED` chưa dùng |
| Hóa đơn PDF | Chưa có |
| Tích hợp đơn vị vận chuyển | Chỉ `trackingCode` text |
| Multi-warehouse | Một kho `default` |
| Vector semantic search | Placeholder |
| E2E tests | Hầu như chưa có |
| OpenAPI Swagger UI | Dependency có, chưa verify expose |

---

## 19. Tiêu chí hoàn thành (Definition of Done)

### 19.1. MVP — ✅ Đã đạt

- [x] Đăng ký, login, refresh, logout, quản lý phiên
- [x] Xem sản phẩm, chọn size/màu, thêm giỏ (user đăng nhập)
- [x] Checkout reserve stock, tạo order + payment
- [x] IPN SePay idempotent, cập nhật order/payment đúng một lần
- [x] Payment failed/timeout release stock + email
- [x] Lịch sử đơn, chi tiết, hủy
- [x] Admin: product, variant, inventory, order
- [x] Review verified purchase
- [x] Return workflow tối thiểu + restock
- [x] Không hard-code secrets (dùng env)

### 19.2. MVP+ (sau gap audit) — ✅ Phần lớn

- [x] Payment ownership / IDOR fix
- [x] Payment success FE xác minh BE
- [x] RBAC runtime FE + `@perm.has` BE
- [x] Reports dashboard API trên FE admin
- [x] Inventory import UI
- [x] ES nested filters (optional)
- [x] AI chat UI + notifications page
- [x] Session cookie `refresh_token` fix

### 19.3. Production-ready — ⚠️ Còn lại

- [ ] E2E + integration test coverage đầy đủ
- [ ] Voucher / multi-pay / auto refund SePay
- [ ] Guest cart (nếu product yêu cầu)
- [ ] Admin polish (brand/category edit, order detail page)
- [ ] Review re-index ES khi có rating mới

---

*Tài liệu này phản ánh codebase SOLE tại nhánh `main` sau commit gap audit. Khi thêm tính năng mới, cập nhật mục 6 (trạng thái triển khai) và mục 18 (phạm vi hoãn) tương ứng.*
