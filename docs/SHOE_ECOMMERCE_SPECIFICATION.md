# Đặc tả hệ thống SOLE — E-commerce giày dép

> **Phiên bản tài liệu:** handover khách hàng + return detail pages + catalog Cloudinary seed (08/2026).  
> **Trạng thái hệ thống:** MVP+ (~95%) — luồng mua hàng end-to-end, return/refund, guest cart, **AI Function Calling** (text + voice + visual search).

**Sơ đồ luồng trực quan:** [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md)  
**Giao diện / design tokens:** [`UI_DESIGN_SYSTEM.md`](./UI_DESIGN_SYSTEM.md)

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
20. [Handover — bàn giao khách hàng](#20-handover--bàn-giao-khách-hàng) — gồm [§20.10 SePay + ngrok](#2010-cấu-hình-sepay--ngrok-tài-khoản-riêng)

**Tài liệu liên quan:**

| File | Mô tả |
|------|-------|
| [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md) | Sơ đồ Mermaid từng luồng chức năng |
| [`UI_DESIGN_SYSTEM.md`](./UI_DESIGN_SYSTEM.md) | Design tokens, component, layout |

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
- Nền tảng mở rộng: promotion/coupon, VAT cấu hình, guest cart, **AI assistant Function Calling** (tools + structured output + voice + visual search).

### 1.3. Phạm vi đã bổ sung (Release R0–R4)

| Giai đoạn | Nội dung chính |
|-----------|----------------|
| **R0** | Bật `permission.enforcement`, trang payment error/cancel poll BE, integration test payment/inventory, checklist staging |
| **R1** | Admin order detail, return/address/checkout polish, mở rộng `@perm.has`, runbook refund |
| **R2** | Guest cart BE (`guestSessionId` + merge khi login), route `/cart` public, FloatingChatbot |
| **R3** | Correlation ID, Playwright smoke E2E, inventory paging |
| **R4** | Module `promotions/` (coupon + checkout), `VatCalculator`, FE coupon checkout + admin promotions |
| **AI** | OpenAI Function Calling, structured JSON, **Whisper voice pipeline** (hallucination filter + ASR normalizer), **gpt-4o** vision + `ImageSearchService`, guest Redis / login MongoDB history |

### 1.4. Ngoài phạm vi MVP hiện tại

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
| **GUEST** | Chưa đăng nhập | Xem SP, tìm kiếm/lọc, **giỏ guest** (`guestSessionId` cookie), AI chat widget, xem review công khai |
| **CUSTOMER** | Khách hàng | Giỏ hàng, checkout, đơn hàng, địa chỉ, đánh giá, wishlist, yêu cầu trả hàng |
| **STAFF** | Nhân viên | Xử lý đơn, hỗ trợ KH, tạo/sửa sản phẩm draft, xác nhận/trả hàng bước đầu |
| **SHOP_MANAGER** | Quản lý shop | Duyệt sản phẩm, quản lý tồn kho, duyệt hoàn tiền/trả hàng, xem báo cáo |
| **ADMIN** | Quản trị | Quản lý user, cấu hình, toàn quyền admin (trừ RBAC matrix) |
| **SUPER_ADMIN** | Chủ hệ thống | Mọi quyền + sửa ma trận phân quyền trên UI |

### 2.2. Ma trận quyền thực tế (MVP+)

| Chức năng | Guest | Customer | Staff | Shop Manager | Admin |
|-----------|:-----:|:--------:|:-----:|:------------:|:-----:|
| Duyệt & lọc sản phẩm | ✅ | ✅ | ✅ | ✅ | ✅ |
| Thêm giỏ hàng | ✅** | ✅ | ✅ | ✅ | ✅ |
| Checkout SePay | ❌ | ✅ | ✅ | ✅ | ✅ |
| Xem đơn/review/return của mình | ❌ | ✅ | ✅ | ✅ | ✅ |
| Duyệt sản phẩm | — | — | ❌ | ✅ | ✅ |
| Xử lý return/refund | — | Yêu cầu | Xác nhận | Duyệt/hoàn | ✅ |
| Ma trận RBAC UI | — | — | — | — | SUPER_ADMIN |
| Báo cáo doanh thu | — | — | Hạn chế FE | ✅ | ✅ |

| AI chat (widget + `/ai-chat`) | ✅ | ✅ | ✅ | ✅ | ✅ |

\**Guest:* thêm/sửa giỏ qua `/cart/**` không cần login; cookie `guestSessionId` gắn giỏ guest. **Checkout vẫn yêu cầu đăng nhập** — sau login giỏ guest merge vào giỏ user (`GuestCartMergeService`).

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
| Tìm kiếm | MongoDB `$text` full-text index (`name`, `shortDescription`, `description`) + filter in-memory |
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
    catalog/        # Sản phẩm, brand, category, variant; search/ ($text FTS)
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

Giỏ theo `userId` **hoặc** `guestSessionId` (một giỏ ACTIVE mỗi identity).

```text
Cart: cartId, userId?, guestSessionId?, status (ACTIVE), items[]
CartItem: cartItemId, variantId, quantity, priceSnapshot
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

> Luồng chi tiết: [§8.7](#87-đổi--trả--hoàn-tiền) · Sơ đồ: [`FUNCTIONAL_FLOWS.md` §6](./FUNCTIONAL_FLOWS.md#6-đổi--trả--hoàn-tiền)

```text
returnId, orderId, orderItemId, userId, reason, customerNote, imageUrls[]
refundBankName, refundAccountNumber, refundAccountHolder
status: PENDING | STAFF_CONFIRMED | APPROVED | REJECTED | RECEIVED | REFUND_PENDING | REFUNDED | CLOSED
itemCondition: GOOD | DAMAGED | INCOMPLETE
maxRefundAmount, shipBackDeadlineAt, receiveNote
refundAmount, refundStatus, refundMethod, refundTransactionRef, refundProofUrl
refundRequestedBy, refundedBy, staffNote, managerNote, rejectedReason
milestones: staffConfirmedAt, approvedAt, receivedAt, refundRequestedAt, refundCompletedAt, ...
```

**Chính sách shop:** cửa sổ trả 7 ngày · hạn gửi hàng 7 ngày sau duyệt · **TK nhận hoàn bắt buộc lúc tạo yêu cầu** · trần hoàn 100%/50%/30% theo tình trạng hàng · restock chỉ khi GOOD · hoàn tiền 2 bước (REFUND_PENDING → REFUNDED sau chuyển khoản thực tế + chứng từ upload tuỳ chọn).

### 5.9. Review, Wishlist, Address, Notification

- **Review:** gắn `orderId` + `orderItemId`; verified purchase; vote dedupe phía BE.
- **Wishlist:** `userId` + `productId` unique.
- **Address:** sổ địa chỉ giao hàng; một địa chỉ `isDefault`; ward/district trên FE.
- **Notification:** in-app + SSE; `targetUrl` deep link.

### 5.10. Coupon (Promotions)

```text
Coupon: code, type, value, minOrderAmount, maxDiscount
        usageLimit, perUserLimit, brandIds[], categoryIds[]
        startsAt, endsAt, active, usedCount
CouponUsage: couponId, userId, orderId, discountApplied
```

### 5.11. AI (Conversation, Tools & Embeddings)

```text
AiConversation: conversationId, userId, title, messages[], timestamps   # login — persistent
AiMessage: role, content, routeType (legacy), timestamp
AiEmbedding: id, entityType (PRODUCT|POLICY), entityId, text, embedding[], updatedAt  # index startup
Redis chat:history:{conversationId}  # guest session, TTL 30 phút
```

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
| Điều chỉnh thủ công | Admin `PUT /admin/inventory/{variantId}/adjust` |
| Import CSV | Admin `POST /admin/inventory/import` — FE có textarea `variantId,quantity` |
| Restock khi trả hàng | Return `RECEIVED` → `InventoryService.restock()` — giảm `sold`, tăng `onHand`/`available` |
| Scheduler | Job expire reservation + expire payment pending |

### 6.4. Giỏ hàng (Cart) — ✅

| Chức năng | Trạng thái | Cách hoạt động |
|-----------|:----------:|----------------|
| CRUD giỏ user | ✅ | Theo `userId`; merge quantity cùng `variantId` |
| **Guest cart** | ✅ | Cookie/header `guestSessionId`; cart document `guestSessionId` + `status=ACTIVE`; API `/cart/**` **permitAll** |
| Merge khi login | ✅ | `AuthServiceImpl` gọi `GuestCartMergeService.mergeGuestCartIntoUser` sau login/register/Google/refresh có guest cookie |
| Validate | ✅ | `POST /cart/validate` — stock, giá, variant active; trả `issues[]` từng dòng |
| Re-validate FE | ✅ | Cart page debounce gọi validate sau đổi số lượng |
| FE public route | ✅ | `/cart` không bọc `ProtectedRoute`; Header link giỏ không bắt login |

**Luồng guest → customer:**

```text
Guest thêm SP → Cart(guestSessionId=guest-xxx)
→ Login → merge items vào Cart(userId) → xóa/ deactivate guest cart
→ Checkout (yêu cầu auth)
```

### 6.5. Checkout — ✅ / ⚠️

**Luồng `POST /checkout`:**

1. Load giỏ user, validate từng item.
2. Snapshot địa chỉ từ `addressId` (ownership check).
3. **Validate coupon** (nếu có `couponCode`) qua `CouponValidator` — fail thì release reservation.
4. Tính: `subtotal` → `discountTotal` → `VatCalculator` (`vat.rate` env) → `ShippingFeeCalculator` → `grandTotal`.
5. **Reserve tồn kho** toàn bộ dòng (`StockReservation` TTL 15 phút).
6. Tạo order `PENDING_PAYMENT` + payment `PENDING`; ghi `CouponUsage` nếu áp mã.
7. Trả `PaymentCheckoutResponse` — FE auto-submit form SePay.

| Hạng mục | Trạng thái | Chi tiết |
|----------|:----------:|----------|
| Preview | ✅ | `POST /checkout/preview?couponCode=` — subtotal, discount, tax, shipping, grandTotal |
| Coupon | ✅ | `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`; min order, usage limit, per-user limit |
| VAT | ✅ | `vat.rate` (mặc định 0); `taxTotal = (subtotal - discount) × rate` |
| customerNote | ✅ | Ghi vào order; FE checkout có input |
| Phương thức thanh toán | ⚠️ | Hard-code `SEPAY` |
| Invalid coupon rollback | ✅ | Release reservation nếu validate coupon fail sau reserve |

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
| **Admin order detail** | ✅ | `/admin/orders/:orderId`, `/staff/orders/:orderId` — snapshot items, payment, return panel |
| Email vận chuyển | ✅ | Shipped, delivered templates |

### 6.8. Đổi / trả / hoàn tiền (Returns) — ✅

> Luồng: [§8.7](#87-đổi--trả--hoàn-tiền) · Sơ đồ: [`FUNCTIONAL_FLOWS.md` §6](./FUNCTIONAL_FLOWS.md#6-đổi--trả--hoàn-tiền)

**Workflow thực tế:**

```text
PENDING
  → STAFF_CONFIRMED (Staff) hoặc REJECTED (lý do ≥ 10 ký tự)
  → APPROVED (Manager — set shipBackDeadlineAt +7 ngày)
  → RECEIVED (Staff — itemCondition → maxRefundAmount, restock nếu GOOD)
  → REFUND_PENDING (Manager — chấp nhận hoàn, chưa REFUNDED order)
  → REFUNDED (Manager confirm sau chuyển khoản thực tế + mã GD)
```

| Hạng mục | Trạng thái |
|----------|:----------:|
| Cửa sổ 7 ngày sau `deliveredAt` | ✅ |
| Hạn gửi hàng 7 ngày + auto-reject quá hạn | ✅ Scheduler |
| Kiểm tra tình trạng hàng & trần hoàn | ✅ GOOD/DAMAGED/INCOMPLETE |
| Hoàn tiền 2 bước REFUND_PENDING → REFUNDED | ✅ |
| Validate số tiền ≤ min(maxRefund, payment) | ✅ |
| TK nhận hoàn khi tạo return (bank name / STK / chủ TK) | ✅ |
| Upload ảnh minh chứng customer (≤ 4 × 5MB) | ✅ `/media/images?folder=returns` |
| Upload chứng từ hoàn Manager (≤ 5MB) | ✅ `/admin/media/images?folder=refund-proofs` |
| ConfirmRefundDialog hiển thị TK khách | ✅ |
| Dashboard cảnh báo overdue / stale refund | ✅ Admin dashboard + `/admin/returns` |
| Chặn bypass API generic updateStatus | ✅ RECEIVED/REFUND_* |
| Unit + integration test return | ✅ ReturnServiceTest, returnFlow.test.ts |
| Hoàn tiền SePay API tự động | ❌ Manual CK + confirm |
| Restock | ✅ Chỉ khi itemCondition = GOOD |
| FE admin MarkReceivedDialog + ConfirmRefundDialog | ✅ |
| FE customer MyReturns + detail `/returns/:returnId` | ✅ |
| FE admin ReturnManagement + detail `/admin/returns/:returnId` | ✅ |

### 6.9. Đánh giá (Reviews) — ✅ / ⚠️

- Chỉ tạo được khi order item thuộc đơn `DELIVERED`/`COMPLETED`, mỗi item một review.
- Admin: reply, ẩn/hiện review.
- ⚠️ FE chưa vote «helpful»; My Reviews read-only.

### 6.10. Wishlist & Địa chỉ — ✅

| Chức năng | Trạng thái | Chi tiết |
|-----------|:----------:|----------|
| Wishlist CRUD | ✅ | add/remove/list theo user |
| Address book | ✅ | CRUD đầy đủ; form có ward/district; set default |
| Checkout chọn địa chỉ | ✅ | Dropdown từ address book |

### 6.11. Thông báo — ✅

- Bell dropdown (8 mục gần nhất) + SSE stream realtime.
- Trang đầy đủ `/notifications` — phân trang, đánh dấu đã đọc.
- Deep link qua `targetUrl`.

### 6.12. Báo cáo (Reports) — ✅

- `GET /admin/reports/dashboard?from=&to=` — tổng đơn, doanh thu, user, sản phẩm, low stock, return pending.
- FE Dashboard Admin gọi API này (không còn filter client-side trên 500 đơn cho stats chính).
- Charts vẫn dùng subset orders cho biểu đồ.

### 6.13. Tìm kiếm — ✅

| Thành phần | Mô tả |
|------------|-------|
| Engine | MongoDB `$text` trên `name` (weight 10), `shortDescription` (5), `description` (1) |
| Startup | `ProductTextIndexInitializer` — `ensureIndex` text index khi app sẵn sàng |
| Query | `ProductTextSearchService` — sanitize keyword, sort theo `textScore` |
| Filter | `CatalogService.searchPublishedMongo` — brand/category/gender/price/size/color/inStock/sort (in-memory sau text query) |
| Giới hạn | Tokenization tiếng Việt cơ bản; đủ cho catalog demo (~200 SP) |

### 6.14. Khuyến mãi / Coupon (Promotions) — ✅

| Chức năng | Cách hoạt động |
|-----------|----------------|
| Model `Coupon` | `code`, `type` (PERCENTAGE/FIXED_AMOUNT/FREE_SHIPPING), `value`, `minOrderAmount`, `maxDiscount`, limits, brand/category scope (field có, validator brand/category ⚠️ chưa enforce) |
| Validate | `POST /promotions/validate` — auth; trả message tiếng Việt |
| Checkout | `couponCode` trên request; `CouponValidator` + `PromotionService.recordUsage` |
| Admin CRUD | `/admin/promotions/**` — FE `PromotionManagementPage` |
| Preview checkout | FE nhập mã → gọi preview API cập nhật discount/shipping |

### 6.15. Trợ lý AI — ✅

Tóm tắt; chi tiết kỹ thuật tại [mục 15](#15-trợ-lý-ai-mua-sắm) và [`AI_Function_Calling_Implementation.md`](./AI_Function_Calling_Implementation.md).

| Thành phần | Mô tả |
|------------|-------|
| Entry | `POST /ai/chat`, `/ai/chat/voice`, `/ai/chat/image` (permitAll, CSRF exempt); menu header **Trợ lý AI** → `/ai-chat`; `FloatingChatbot` |
| Orchestration | `AiOrchestratorService` — tool loop (max 4) → Structured Output; **image mode** bỏ `search_catalog` |
| Tools (guest) | `search_catalog`, `get_policy` (text chat); image search: chỉ `get_policy` |
| Tools (login) | + `get_order_status`, `get_return_info` (read-only, không tạo return) |
| History | Guest: Redis `chat:history:{id}` TTL 30 phút; Login: MongoDB `ai_conversations` |
| Response | `answer`, `suggestedProducts[]`, `warnings[]`; optional `transcript`, `sourceImageUrl` |
| Visual | WebP → Cloudinary → **GPT-4o** structured `VisionAnalysis` → `ImageSearchService` relevance filter |
| Voice | `VoiceTranscriptService`: Whisper (`prompt` vocab) → `WhisperTranscriptFilter` → `TranscriptNormalizerService` |
| Rate limit | Redis: chat 30 / voice 10 / image 10 requests / 15 phút / IP |

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
GET/DELETE /cart                         # user hoặc guest (guestSessionId)
POST/PUT/DELETE /cart/items/...
POST       /cart/validate
POST       /checkout/preview             # ?couponCode=
POST       /checkout                     # body: addressId, couponCode?, customerNote?
```

**Guest cart:** Header/cookie `guestSessionId` do `GuestCartSupport` resolve; không cần JWT.

### 7.5b. Promotions

```text
POST /promotions/validate                # auth — body: code, subtotal
GET/POST/PUT/DELETE /admin/promotions/...
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
POST /admin/returns/{id}/mark-received     # body: itemCondition, receiveNote, note
POST /admin/returns/{id}/request-refund
POST /admin/returns/{id}/confirm-refund  # body: amount, transactionRef, method, proofUrl (upload qua /admin/media/images)
POST /admin/media/images?folder=refund-proofs  # chứng từ CK, ≤ 5MB
POST /admin/returns/{id}/refund          # deprecated → request-refund
```

### 7.9. Notifications, Reports, AI, Search

```text
GET/PUT  /notifications/...
GET      /notifications/stream           # SSE — client disconnect handled gracefully
GET      /admin/reports/dashboard
POST     /ai/chat                        # permitAll; text chat
POST     /ai/chat/voice                  # permitAll; multipart audio → Whisper
POST     /ai/chat/image                  # permitAll; multipart image → Vision
GET      /ai/conversations/...           # auth — lịch sử hội thoại (MongoDB)
```

**`POST /ai/chat` request:**

```json
{ "conversationId": "optional", "message": "câu hỏi" }
```

**`POST /ai/chat/voice`:** `multipart/form-data` — `audio` (webm/mp3/wav/m4a, ≤10MB), `conversationId?`

**`POST /ai/chat/image`:** `multipart/form-data` — `image` (JPEG/PNG/WebP/HEIC/GIF/BMP/TIFF, ≤10MB), `conversationId?`, `message?` (caption)

**Response `data`:**

```json
{
  "conversationId": "...",
  "answer": "...",
  "suggestedProducts": [{ "productId", "name", "slug", "minPrice", "imageUrl" }],
  "warnings": ["Đăng nhập để xem trạng thái đơn hàng..."],
  "transcript": "optional — voice only",
  "sourceImageUrl": "optional — image search only"
}
```

> `routeType` đã deprecated (không còn trong luồng Function Calling).

---

## 8. Luồng nghiệp vụ chính

> **Sơ đồ Mermaid đầy đủ:** [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md)

### 8.1. Duyệt và lọc sản phẩm

```text
User → Trang listing (/products)
     → Filter drawer (brand, category, gender, size, color, giá, còn hàng)
     → Sync query params URL (share link)
     → Backend: MongoDB `$text` + filter variant/giá/tồn kho (in-memory)
     → PDP: chọn size/màu → hiển thị stock variant
     → Add to cart (guest/user) / Buy now (login → checkout)
```

### 8.2. Thêm giỏ hàng

```text
Guest/User chọn variant + quantity
→ POST /cart/items { variantId, quantity }
→ BE: resolveCart(userId | guestSessionId từ cookie)
→ Kiểm variant ACTIVE, available > 0
→ Merge hoặc thêm dòng mới
→ POST /cart/validate (FE debounce sau đổi qty)
→ Guest muốn checkout → /login?redirect=/checkout → merge giỏ guest
```

### 8.3. Checkout

```text
Customer mở /checkout (login required)
→ Chọn địa chỉ (addressId), nhập coupon (optional), customerNote
→ POST /checkout/preview?couponCode= — xem discount, VAT, shipping, grandTotal
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

> Sơ đồ: [`FUNCTIONAL_FLOWS.md` §6](./FUNCTIONAL_FLOWS.md#6-đổi--trả--hoàn-tiền) · Model: [§5.8](#58-return-request-rma)

```text
Customer (DELIVERED/COMPLETED, ≤7 ngày sau giao)
→ POST /returns { refundBankName, refundAccountNumber, refundAccountHolder, reason, imageUrls? }
→ POST /media/images?folder=returns (tuỳ chọn, ≤ 4 ảnh × 5MB)
→ Staff: staff-confirm / reject (≥10 ký tự)
→ Manager: approve (+ shipBackDeadlineAt 7 ngày) — thông báo dùng #orderCode
→ Staff: mark-received { itemCondition } → maxRefundAmount, restock nếu GOOD
→ Manager: request-refund → REFUND_PENDING (order chưa REFUNDED)
→ Manager: chuyển tiền vào TK khách (xem ConfirmRefundDialog / detail panel)
→ POST /admin/media/images?folder=refund-proofs (chứng từ, tuỳ chọn, ≤ 5MB)
→ Manager: confirm-refund { amount, transactionRef, method, proofUrl? } → REFUNDED
```

**API generic `PUT .../status` bị chặn** cho `RECEIVED`, `REFUND_PENDING`, `REFUNDED` — phải dùng endpoint chuyên biệt.

**Scheduler (hourly):** auto-reject APPROVED quá `shipBackDeadlineAt`.

---

## 9. Quy tắc giá, vận chuyển, tồn kho

### 9.1. Giá, coupon và VAT

| Thành phần | Quy tắc |
|------------|---------|
| Giá bán | Lấy từ **variant** tại thời điểm checkout; snapshot `unitPrice`, `lineTotal` trên order item |
| Client amount | **Không tin** số tiền từ FE — BE tính lại toàn bộ |
| Coupon PERCENTAGE | `discount = subtotal × value%`, cap bởi `maxDiscount` |
| Coupon FIXED_AMOUNT | Trừ cố định, không vượt subtotal |
| Coupon FREE_SHIPPING | `shippingFee = 0` |
| VAT | `VatCalculator`: `taxTotal = max(0, subtotal - discount) × vat.rate`; mặc định `vat.rate=0` |
| Module | `be/modules/promotions/` — `Coupon`, `CouponValidator`, `PromotionService` |

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

**Trả hàng đã nhận (chỉ `itemCondition = GOOD`):**

```text
sold -= quantity; onHand += quantity; available recalc
(DAMAGED / INCOMPLETE: không restock; trần hoàn 50% / 30%)
```

Cập nhật atomic qua MongoTemplate (`updateFirst` với điều kiện `available >= qty`).

---

## 10. Yêu cầu bảo mật

### 10.1. Xác thực — ✅

- Access token + refresh token: HttpOnly cookie.
- Session refresh lưu Redis; hỗ trợ revoke đa thiết bị.
- Logout blacklist access token.

### 10.2. CSRF — ✅

- Cookie auth → POST/PUT/PATCH/DELETE yêu cầu CSRF token (`X-XSRF-TOKEN`).
- `SpaCsrfTokenRequestHandler` cho SPA; exempt: auth register/login/refresh, SePay IPN, **`POST /ai/chat`**, **`POST /ai/chat/voice`**, **`POST /ai/chat/image`** (guest chat).
- `publicAxios` FE gửi CSRF khi cookie có sẵn.

### 10.3. Rate limiting — ✅

- Login, register, OTP, forgot password, checkout — `RateLimitFilter`.

### 10.4. Thanh toán — ✅

- Verify chữ ký SePay IPN.
- Idempotency qua `PaymentEvent`.
- Không cập nhật payment từ trang success FE trực tiếp.
- Tra cứu payment có **ownership check**.

### 10.5. Upload — ✅

- Cloudinary; validate MIME/size qua `ImageUploadValidator`.
- **Catalog admin:** `POST /admin/catalog/images` (staff/admin).
- **Khách hàng:** `POST /media/images?folder=reviews|returns` (authenticated, max 4 ảnh).

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
| `/cart` | Giỏ — **guest hoặc user**; validate debounce |
| *(global)* | **FloatingChatbot** — AI widget (ẩn trên `/ai-chat`, admin, auth pages) |

### 11.2. Trang khách hàng — ✅

| Route | Mô tả |
|-------|-------|
| `/cart` | Giỏ — guest/user |
| `/checkout` | Địa chỉ, **coupon**, preview, customerNote, submit SePay |
| `/payment/success\|error\|cancel` | Kết quả thanh toán — success poll BE |
| `/orders`, `/orders/:id` | Lịch sử, chi tiết, hủy, review, return |
| `/returns` | Danh sách yêu cầu trả |
| `/returns/:returnId` | Chi tiết yêu cầu trả (timeline, TK hoàn, ảnh) |
| `/reviews` | Đánh giá của tôi |
| `/wishlist` | Danh sách yêu thích |
| `/addresses` | Sổ địa chỉ |
| `/profile` | Hồ sơ + panel phiên đăng nhập |
| `/notifications` | Thông báo đầy đủ |
| `/ai-chat` | Trợ lý AI — guest + login; mic, upload ảnh; **suggestedProducts**, warnings |

### 11.3. Admin / Staff — ✅

| Route | Mô tả |
|-------|-------|
| `/admin` | Dashboard — stats từ reports API, charts, export Excel, low-stock widget |
| `/admin/products` | CRUD, approve, publish/unpublish |
| `/admin/orders` | List + **OrderDetailAdminPage** (`/admin/orders/:orderId`) |
| `/admin/promotions` | Quản lý coupon — `PromotionManagementPage` |
| `/admin/inventory` | Tồn kho, adjust, import CSV |
| `/admin/returns` | Danh sách return — lọc trạng thái, cảnh báo overdue |
| `/admin/returns/:returnId` | Chi tiết return + thao tác workflow |
| `/staff/returns/:returnId` | Chi tiết return (staff) |
| `/admin/reviews` | Kiểm duyệt |
| `/admin/role-permissions` | Ma trận RBAC (SUPER_ADMIN) |
| `/staff/orders/:orderId` | Chi tiết đơn cho staff |
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
- `STAFF_CONFIRMED`: Duyệt trả hàng / Từ chối
- `APPROVED`: Đã nhận hàng → dialog chọn tình trạng hàng
- `RECEIVED`: Yêu cầu hoàn tiền
- `REFUND_PENDING`: Xác nhận đã hoàn (số tiền, mã GD, phương thức)

Banner cảnh báo khi có return quá hạn gửi hoặc REFUND_PENDING > 3 ngày.

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

### 14.1. MongoDB full-text search — ✅

- Text index trên `products`: `name`, `shortDescription`, `description` (weights khác nhau).
- Query: `$text` + `$meta: textScore` sort relevance khi có `search` param.
- Filter bổ sung (brand, category, gender, min/max price, size, color, inStock, sort) xử lý trong `CatalogService` sau text query.
- Keyword sanitize: loại `"`, `-` (negation), collapse whitespace.
- **Lưu ý:** Mongo `$text` không segment tiếng Việt tốt như dedicated search engine; chấp nhận cho quy mô catalog demo.

### 14.2. AI embedding index (legacy) — ✅

**Phạm vi:** Index product/policy cho startup; chat runtime dùng tool `search_catalog` + `CatalogContextProvider`, không phụ thuộc embedding retrieval trong orchestrator.

| Thành phần | Mô tả |
|------------|-------|
| Collection | `ai_embeddings` — `entityType` (PRODUCT/POLICY), `entityId`, `text`, `embedding[]` |
| Index | `AiIndexService` — embed product/policy; hook publish/unpublish; startup nếu rỗng |
| Retrieval | `AiRetrievalService` — embed câu hỏi → cosine top-k → hydrate catalog |
| Cache | Redis `ai:emb:{sha256}` TTL 7 ngày |
| Fallback | Không có API key / embed fail → keyword search qua `CatalogContextProvider` |

---

## 15. Trợ lý AI mua sắm

### 15.1. Kiến trúc tổng thể — ✅ (Function Calling)

```text
FE AiChatComposer / FloatingChatbot / AiChatPage
  → POST /api/ai/chat | /ai/chat/voice | /ai/chat/image
  → AiChatService → AiOrchestratorService
       ├─ [voice] VoiceTranscriptService
       │    ├─ WhisperClient (prompt domain vocab, verbose_json, temperature=0)
       │    ├─ WhisperTranscriptFilter (no_speech_prob, avg_logprob, blacklist)
       │    └─ TranscriptNormalizerService (gpt-4o-mini ASR correction)
       ├─ ConversationHistoryService (guest: Redis; login: MongoDB)
       ├─ [text/voice] resolveToolsForUser → tool loop (max 4)
       ├─ [image] ImageSearchService.resolve(VisionAnalysis) → ImageSearchContext
       │    ├─ VisionClient.analyzeImage (gpt-4o, JSON schema)
       │    ├─ CatalogContextProvider.searchWithFilters
       │    └─ ImageSearchMatcher.filterExactMatches (brand/model)
       ├─ [image] resolveToolsWithoutCatalog — KHÔNG search_catalog
       ├─ OpenAiClient.chatWithStructuredOutput() → JSON schema
       └─ applyImageSearchProducts / ImageSearchResponses khi không khớp catalog
  → Response: answer, suggestedProducts[], warnings[], transcript?, sourceImageUrl?
```

**Voice:** FE `MIN_RECORDING_MS=800` → `VoiceTranscriptService` → orchestrator (text mode).  
**Image:** `AiImageValidator` → `ImageNormalizer` (WebP) → Cloudinary → `VisionClient` (`gpt-4o`) → `ImageSearchService` → orchestrator image mode.

### 15.2. Tools (thay `AiRouteType` keyword routing)

| Tool | Guest | Login | Mô tả |
|------|-------|-------|--------|
| `search_catalog` | ✅ | ✅ | Tìm SP theo query, size, color, giá, category |
| `get_policy` | ✅ | ✅ | topic: return, payment, shipping, warranty, order |
| `get_order_status` | ❌ | ✅ | Đơn gần nhất hoặc theo orderId/orderCode `SO-*` |
| `get_return_info` | ❌ | ✅ | Yêu cầu đổi trả hiện có + eligibility; hướng `/returns` |

Model có thể gọi **nhiều tool** trong một lượt (ví dụ: vừa tra đơn vừa tìm giày).

### 15.3. Grounding & bảo mật

- `userId` chỉ từ JWT — **không** nhận từ tool arguments.
- Guest: không đưa tool order/return vào danh sách gửi OpenAI; `ToolDispatcher.requireLogin()` là lớp phòng thủ thứ 2.
- Prompt (`AiPromptTemplates.systemPrompt`): chỉ dùng dữ liệu tool; không tạo/hủy đơn, hoàn tiền, return.
- Guest hỏi đơn hàng → `warnings` nhắc đăng nhập.
- Rate limit Redis trên `/ai/chat`, `/ai/chat/voice`, `/ai/chat/image`.
- Thiếu `OPENAI_API_KEY` → message cấu hình; API lỗi → message tiếng Việt.

### 15.4. Dữ liệu lưu trữ

| Store | Dùng cho | Ghi chú |
|-------|----------|---------|
| Redis `chat:history:{conversationId}` | Guest session | TTL 30 phút; trim 8 turn |
| MongoDB `ai_conversations` | User đã login | CRUD `/ai/conversations/**` |
| Redis `policyCache` | Policy tool | Spring `@Cacheable` |
| MongoDB `ai_embeddings` | Index startup (legacy RAG) | Vẫn index product/policy; chat dùng tool search |

### 15.5. Giao diện FE

| Thành phần | Hành vi |
|------------|---------|
| `FloatingChatbot` | Global widget; guest OK; `AiChatComposer` (+ menu ảnh/voice) |
| `AiChatPage` | `/ai-chat` — full page; ẩn floating widget; link từ menu header **Trợ lý AI** |
| `AiChatComposer` | Menu `+` → chọn ảnh / ghi âm; preview ảnh + caption; `MIN_RECORDING_MS=800` |
| `AiMessageContent` | Render markdown nhẹ (`**bold**`, list) |
| `AiSuggestedProducts` | Card SP; link `/products/{slug}`; fallback icon khi ảnh lỗi |
| `aiApi` | `chat()`, `chatVoice(blob)`, `chatImage(file, conversationId?, message?)` |

### 15.6. Cấu hình (`.env`)

```text
# OpenAI
OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL, OPENAI_TIMEOUT_MS
OPENAI_MAX_TOOL_LOOP=4
OPENAI_STRUCTURED_OUTPUT_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o

# AI image (visual search)
AI_IMAGE_WEBP_QUALITY=85
AI_IMAGE_MAX_INPUT_BYTES=10485760
AI_IMAGE_MAX_DIMENSION=4096

# Rate limits (15 phút / IP)
RATE_LIMIT_AI_CHAT_MAX=30
RATE_LIMIT_AI_VOICE_MAX=10
RATE_LIMIT_AI_IMAGE_MAX=10

# Cloudinary (bắt buộc cho /ai/chat/image)
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# Legacy embedding index (tuỳ chọn)
AI_RETRIEVAL_PRODUCT_TOP_K=5
AI_RETRIEVAL_POLICY_TOP_K=2
AI_CONVERSATION_HISTORY_TURNS=8
AI_REINDEX_ON_STARTUP=false
```

Chi tiết implementation: [`AI_Function_Calling_Implementation.md`](./AI_Function_Calling_Implementation.md).

---

## 16. Chiến lược kiểm thử

### 16.1. Đã có — ✅

| Layer | Tests | Mô tả |
|-------|-------|-------|
| BE payment | `EcommercePaymentServiceTest` | IPN idempotent, amount mismatch, expire + mail |
| BE returns | `ReturnRefundPolicyTest`, `ReturnServiceTest` | Tỷ lệ hoàn, state machine, validate refund |
| BE mail | `OrderMailNotifierTest` | Template order lifecycle + return approved |
| BE checkout | `CheckoutServiceTest`, `CheckoutCalculatorTest` | Reserve, invalid coupon rollback |
| BE cart | `CartServiceTest`, `GuestCartMergeServiceTest` | Guest merge, ownership |
| BE promotions | `CouponValidatorTest`, `PromotionServiceTest` | Validate rules, usage |
| BE RBAC | `RbacServiceTest`, `SolePermissionEvaluatorTest` | Permission matrix |
| BE inventory | `InventoryServiceTest` | Expire reservations |
| BE AI | `ToolDispatcherTest`, `AiOrchestratorServiceTest`, `WhisperTranscriptFilterTest`, `TranscriptNormalizerServiceTest`, `ImageSearchMatcherTest`, `ImageSearchServiceTest`, `ImageSearchResponsesTest`, `AiAudioValidatorTest`, `AiChatServiceTest` | Function calling, voice ASR, image relevance |
| FE | `commerce.test.ts`, `releaseFeatures.test.ts`, `aiChat.test.ts`, `returnFlow.test.ts` | roleAccess, shipping, return flow |
| E2E | `fe/e2e/smoke.spec.ts` | Playwright smoke (home, products, cart) |

### 16.2. Cần bổ sung — ⚠️

- Integration: checkout concurrent, webhook duplicate full E2E.
- E2E: return flow 6 bước, guest cart → checkout → payment.
- Security regression suite: CSRF, rate limit, IDOR automated.

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
OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL, OPENAI_TIMEOUT_MS
OPENAI_MAX_TOOL_LOOP, OPENAI_STRUCTURED_OUTPUT_MODEL, OPENAI_VISION_MODEL
AI_IMAGE_WEBP_QUALITY, AI_IMAGE_MAX_INPUT_BYTES, AI_IMAGE_MAX_DIMENSION
RATE_LIMIT_AI_CHAT_MAX, RATE_LIMIT_AI_VOICE_MAX, RATE_LIMIT_AI_IMAGE_MAX
AI_RETRIEVAL_PRODUCT_TOP_K, AI_RETRIEVAL_POLICY_TOP_K
AI_CONVERSATION_HISTORY_TURNS, AI_REINDEX_ON_STARTUP
permission.enforcement=true
VAT_RATE=0
shipping.flat-fee=30000, shipping.free-threshold=2000000
PERMISSION_ENFORCEMENT=true
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
| Guest checkout | Guest chỉ giỏ; thanh toán vẫn login-required |
| COD / VNPAY / MoMo | Chỉ SePay |
| Hoàn tiền SePay tự động | Manual chuyển khoản + `confirm-refund` (REFUND_PENDING → REFUNDED) |
| Partial refund tuỳ chỉnh | Chỉ 3 mức condition (100/50/30%) |
| Abandoned cart recovery | Enum `ABANDONED` chưa dùng |
| Hóa đơn PDF | Chưa có |
| Tích hợp đơn vị vận chuyển | Chỉ `trackingCode` text |
| Multi-warehouse | Một kho `default` |
| ES kNN cho catalog lớn | AI RAG dùng Mongo cosine; scale >200 SP cần ES dense_vector |
| AI WEBSEARCH route | Chưa có |
| Conversation history UI | API có; FE sidebar resume chưa có |
| Coupon brand/category scope | Field có; validator chưa enforce |
| E2E coverage đầy đủ | Smoke test có; flow dài chưa |
| OpenAPI Swagger UI prod | Tắt trên profile prod |

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
- [x] Return workflow 6 bước + restock có điều kiện + hoàn 2 bước
- [x] Không hard-code secrets (dùng env)

### 19.2. MVP+ (Release R0–R4 + AI) — ✅ Đã đạt

- [x] Payment ownership / IDOR fix + FE poll success
- [x] RBAC runtime FE + `@perm.has` BE (`permission.enforcement`)
- [x] Reports dashboard API + admin polish
- [x] Guest cart + merge on login
- [x] Coupon module + checkout integration + admin UI
- [x] VAT configurable (`vat.rate`)
- [x] Admin order detail page + staff route
- [x] Address book CRUD + ward/district
- [x] AI RAG + suggested products + order context (login)
- [x] Correlation ID
- [x] Unit test suite mở rộng (BE ~105, FE ~28, AI orchestrator + returnFlow + ReturnServiceTest)

### 19.3. Production-ready — ⚠️ Còn lại

- [ ] E2E đầy đủ (guest cart → checkout → payment)
- [ ] Auto refund SePay / multi-payment gateway
- [ ] Admin brand/category edit UI
- [ ] AI conversation sidebar + WEBSEARCH
- [ ] Load test inventory concurrent checkout

---

## 20. Handover — bàn giao khách hàng

> Mục này dành cho đội vận hành / khách nhận bàn giao. Luồng chi tiết: [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md) · Chạy nhanh: [`README.md`](../README.md).

### 20.1. Bộ tài liệu & cấu trúc repo

| Thành phần | Đường dẫn |
|------------|-----------|
| Spec tổng hợp (tài liệu này) | `docs/SHOE_ECOMMERCE_SPECIFICATION.md` |
| Sơ đồ luồng Mermaid | `docs/FUNCTIONAL_FLOWS.md` |
| Design system FE | `docs/UI_DESIGN_SYSTEM.md` |
| Backend API | `be/src/main/java/www/modules/` |
| Frontend pages | `fe/src/pages/` |
| Seed catalog demo | `be/src/main/java/www/config/CatalogSeedService.java` |
| Script vận hành | `scripts/` |

### 20.2. Chạy hệ thống

**Demo một lệnh (Docker full stack):**

```bash
cp .env.example .env
./scripts/demo-up.sh
```

**Dev local (hot reload):**

```bash
docker compose up -d          # MongoDB + Redis
cd be && ./gradlew bootRun
cd fe && npm run dev
```

**Cổng mặc định:** FE `3000` · BE `3001` · Mongo `27017` · Redis `6379` · Redis Commander `8082`.

### 20.3. URL & tài khoản demo

| URL | Vai trò test |
|-----|--------------|
| http://localhost:3000 | Storefront |
| http://localhost:3000/admin | Admin portal |
| http://localhost:3000/staff | Staff portal |
| http://localhost:3001/swagger-ui.html | API docs (dev) |

| Email | Role | Mật khẩu mặc định |
|-------|------|-------------------|
| `customer@sole.test` | CUSTOMER | `Sole@123` |
| `staff@sole.test` | STAFF | `Sole@123` |
| `manager@sole.test` | SHOP_MANAGER | `Sole@123` |
| `admin@sole.test` | ADMIN | `Sole@123` |
| `superadmin@sole.test` | SUPER_ADMIN | `Sole@123` |

Mật khẩu cấu hình qua `USER_SEED_PASSWORD`. **Tắt seed user trên production:** `USER_SEED_ENABLED=false`.

### 20.4. Checklist staging / go-live

**Hạ tầng & bảo mật**

- [ ] MongoDB + Redis production (backup tự động)
- [ ] `JWT_SECRET` unique, ≥ 32 ký tự
- [ ] `COOKIE_SECURE=true`, `COOKIE_DOMAIN` đúng domain
- [ ] `CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL` trỏ FE production
- [ ] `permission.enforcement=true`
- [ ] `SPRING_PROFILES_ACTIVE=prod` (Swagger tắt)
- [ ] HTTPS end-to-end; không commit `.env`

**Tích hợp bên thứ ba**

- [ ] Cloudinary: upload catalog / return / review / refund proof
- [ ] Resend: OTP, email đơn hàng, shipped/delivered
- [ ] SePay: merchant production, IPN URL HTTPS, `SEPAY_IPN_VERIFY=true`
- [ ] Google OAuth (tuỳ chọn): `GOOGLE_CLIENT_ID` + FE `VITE_GOOGLE_CLIENT_ID`
- [ ] OpenAI (tuỳ chọn): AI chat

**Smoke test nghiệp vụ**

- [ ] Duyệt SP → filter → PDP → thêm giỏ (guest + user)
- [ ] Checkout → SePay sandbox/production → IPN cập nhật đơn
- [ ] Staff ship đơn (tracking) → delivered → customer review
- [ ] Customer tạo return (TK ngân hàng + ảnh) → staff/manager workflow → hoàn tiền 2 bước
- [ ] Admin dashboard: stats, low stock, return alerts
- [ ] `./gradlew test` + `npm run test` + `npm run build` pass

### 20.5. Vận hành catalog & ảnh sản phẩm

**Upload ảnh mới (admin):** Admin → Products → sửa SP → upload qua Cloudinary (`POST /admin/catalog/images`).

**Đồng bộ seed file sau khi đổi ảnh trên DB:**

```bash
# Export slug → URL từ MongoDB
docker exec sole-mongodb mongosh sole_ecommerce --quiet --file scripts/pull-catalog-seed-from-db.js

# Cập nhật URL trong CatalogSeedService.java + scripts/sync-catalog-images-to-db.js
# Push ảnh vào DB (product + toàn bộ variant cùng slug):
docker exec -i sole-mongodb mongosh sole_ecommerce --quiet < scripts/sync-catalog-images-to-db.js
```

**Refresh từ seed khi restart BE:**

```bash
CATALOG_SEED_FORCE=true ./gradlew bootRun
```

Chỉ cập nhật `imageUrls` — không xóa đơn hàng hay tồn kho.

### 20.6. Vận hành đổi / trả / hoàn tiền (runbook)

Luồng 6 bước — sơ đồ: [`FUNCTIONAL_FLOWS.md` §6](./FUNCTIONAL_FLOWS.md#6-đổi--trả--hoàn-tiền).

| Bước | Actor | Hành động |
|------|-------|-----------|
| 1 | Customer | Tạo return (DELIVERED/COMPLETED, ≤ 7 ngày) — **bắt buộc** TK ngân hàng + ảnh tuỳ chọn |
| 2 | Staff | Xác nhận hoặc từ chối (lý do ≥ 10 ký tự) |
| 3 | Manager | Duyệt trả — set hạn gửi hàng 7 ngày |
| 4 | Staff | Đã nhận hàng — chọn tình trạng (GOOD/DAMAGED/INCOMPLETE) → trần hoàn + restock nếu GOOD |
| 5 | Manager | **Yêu cầu hoàn tiền** → `REFUND_PENDING` (chưa REFUNDED order) |
| 6 | Manager | Chuyển khoản thực tế → **Xác nhận đã hoàn** (số tiền, mã GD, upload chứng từ ≤ 5MB) |

**Trang vận hành:** `/admin/returns`, `/admin/returns/:returnId` (staff: `/staff/returns/...`).

**Cảnh báo dashboard:** return quá hạn gửi hàng; `REFUND_PENDING` > 3 ngày chưa xác nhận.

**Lưu ý:** Hoàn tiền **thủ công qua ngân hàng** — hệ thống không tự hoàn qua SePay API.

### 20.7. Tìm kiếm sản phẩm

Storefront search dùng **MongoDB `$text` index** (`ProductTextSearchService`) — không cần Elasticsearch.

AI RAG (`AiIndexService`) dùng embedding riêng — không phụ thuộc storefront search.

### 20.8. Kiểm thử & build

| Lệnh | Kỳ vọng |
|------|---------|
| `cd be && ./gradlew test` | ~105 tests pass |
| `cd fe && npm run test` | ~28 tests pass |
| `cd fe && npm run build` | TypeScript + Vite build OK |

E2E Playwright: smoke home/products/cart — flow checkout/return dài chưa cover đầy đủ.

### 20.9. Phạm vi đã giao vs. mở rộng sau

**Đã giao (MVP+):** mua hàng end-to-end, SePay, guest cart, return/refund 2 bước, RBAC, báo cáo admin, AI chat cơ bản, coupon/VAT.

**Chưa giao / phase sau:** hoàn tiền SePay tự động, guest checkout, E2E đầy đủ, PDF hóa đơn, tích hợp vận chuyển API, multi-warehouse — xem [§18](#18-phạm-vi-chưa-triển-khai--hoãn).

### 20.10. Cấu hình SePay + ngrok (tài khoản riêng)

Mỗi dev / khách triển khai cần **tài khoản SePay riêng** (sandbox khi dev, production khi go-live). Backend **không** embed merchant của ai — chỉ đọc từ `.env`.

#### 20.10.1. Luồng thanh toán (tóm tắt)

```text
Customer checkout → BE tạo EcommercePayment + formData ký HMAC
→ FE POST form tới pay-sandbox.sepay.vn (SePayRedirectForm)
→ Khách thanh toán trên SePay
→ SePay POST IPN → https://<api-host>/api/payments/sepay/callback
→ BE verify X-Secret-Key / chữ ký → cập nhật order PAID (idempotent)
→ Browser redirect → FRONTEND_BASE_URL/payment/success (poll BE)
```

Endpoint IPN trong code: `POST /api/payments/sepay/callback` (public, không JWT).

#### 20.10.2. Bước 1 — Tạo tài khoản SePay sandbox

1. Đăng ký / đăng nhập tại [https://sepay.vn](https://sepay.vn).
2. Vào **Cổng thanh toán** (sandbox) → **Cấu hình** / **Thông tin merchant**.
3. Ghi lại:
   - **Merchant ID** → `SEPAY_MERCHANT_ID`
   - **Secret Key** → `SEPAY_SECRET_KEY` (giữ bí mật, không commit Git)
4. Giữ môi trường sandbox: `SEPAY_ENVIRONMENT=sandbox`, `SEPAY_API_URL=https://pay-sandbox.sepay.vn/v1/checkout/init`.

#### 20.10.3. Bước 2 — Điền `.env` (project root)

```bash
cp .env.example .env
```

```env
SEPAY_MERCHANT_ID=<merchant-id-cua-ban>
SEPAY_SECRET_KEY=<secret-key-cua-ban>
SEPAY_API_URL=https://pay-sandbox.sepay.vn/v1/checkout/init
SEPAY_ENVIRONMENT=sandbox
SEPAY_IPN_VERIFY=true
FRONTEND_BASE_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Restart backend sau khi sửa `.env`: `cd be && ./gradlew bootRun`.

#### 20.10.4. Bước 3 — Cài ngrok (dev local)

SePay gửi IPN từ internet → máy dev `localhost` **không nhận được** trừ khi có tunnel HTTPS.

1. Tạo tài khoản [https://ngrok.com](https://ngrok.com) (free tier đủ dev).
2. Lấy **Authtoken** tại Dashboard → *Your Authtoken*.
3. Cài và đăng ký token:

```bash
brew install ngrok
ngrok config add-authtoken <AUTHTOKEN_CUA_BAN>
chmod +x scripts/ngrok-sepay.sh
```

4. **Terminal 1** — chạy backend (port mặc định `3001`):

```bash
cd be && ./gradlew bootRun
```

5. **Terminal 2** — mở tunnel:

```bash
./scripts/ngrok-sepay.sh
```

6. **Terminal 3** — lấy URL IPN:

```bash
./scripts/ngrok-sepay.sh --url
```

Script in URL dạng:

```text
https://<random>.ngrok-free.app/api/payments/sepay/callback
```

Dashboard ngrok local: http://127.0.0.1:4040 (xem request IPN).

> **Lưu ý:** URL ngrok free **đổi mỗi lần restart ngrok** → phải cập nhật lại SePay Dashboard.

#### 20.10.5. Bước 4 — Cấu hình IPN trên SePay Dashboard

Trên SePay (sandbox) → **Cổng thanh toán** → **Cấu hình** → **IPN / Webhook**:

| Trường | Giá trị |
|--------|---------|
| IPN URL | `https://<subdomain>.ngrok-free.app/api/payments/sepay/callback` |
| Method | `POST` |
| Xác thực | **SECRET_KEY** (Secret Key) |

**Secret Key trên Dashboard phải trùng** `SEPAY_SECRET_KEY` trong `.env`. Backend kiểm tra header `X-Secret-Key` (`SePayIpnVerifier`).

(Tuỳ chọn) Cập nhật tham chiếu trong `.env`:

```env
SEPAY_IPN_URL=https://<subdomain>.ngrok-free.app/api/payments/sepay/callback
```

#### 20.10.6. Bước 5 — Test end-to-end

1. Mở http://localhost:3000 — đăng nhập `customer@sole.test` / `Sole@123`.
2. Thêm sản phẩm → **Checkout** → chọn địa chỉ → thanh toán.
3. Trang SePay sandbox mở (POST form) — hoàn tất thanh toán test.
4. Kiểm tra:
   - Tab ngrok http://127.0.0.1:4040 có `POST .../sepay/callback` → **200**
   - Log BE: payment COMPLETED, order `PAID`
   - FE `/payment/success` hiển thị đơn đã thanh toán
5. Swagger (dev): `GET /api/payments/order/{orderId}` (cần login owner).

#### 20.10.7. Production (không dùng ngrok)

| Biến | Sandbox (dev) | Production |
|------|---------------|------------|
| `SEPAY_API_URL` | `https://pay-sandbox.sepay.vn/v1/checkout/init` | `https://pay.sepay.vn/v1/checkout/init` |
| `SEPAY_ENVIRONMENT` | `sandbox` | `production` |
| IPN URL | ngrok HTTPS (dev) | `https://api.<domain-cua-ban>/api/payments/sepay/callback` |
| `SEPAY_IPN_VERIFY` | `true` (khuyến nghị) | **`true` bắt buộc** |
| `FRONTEND_BASE_URL` | `http://localhost:3000` | `https://shop.<domain-cua-ban>` |

IPN production phải là HTTPS public, firewall mở `POST` tới BE. **Không** dùng `SEPAY_IPN_VERIFY=false` trên production.

#### 20.10.8. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| Checkout báo thiếu `SEPAY_MERCHANT_ID` | Chưa điền `.env` | Thêm merchant + secret, restart BE |
| Đơn vẫn `PENDING_PAYMENT` sau khi trả tiền | IPN không tới BE | Kiểm tra ngrok đang chạy, URL Dashboard đúng path `/api/payments/sepay/callback` |
| IPN **403 Forbidden** | Secret không khớp | Đối chiếu `SEPAY_SECRET_KEY` ↔ SePay Dashboard IPN auth |
| IPN 403 chữ ký HMAC | Lệch timestamp / body | Bật SECRET_KEY auth; đảm bảo `SEPAY_IPN_VERIFY=true` và secret đúng |
| URL ngrok đổi | Restart ngrok free | Chạy lại `./scripts/ngrok-sepay.sh --url`, sửa Dashboard |
| Redirect success nhưng đơn chưa PAID | Chỉ GET redirect, chưa IPN | Chờ POST IPN; success page poll BE — IPN mới là nguồn sự thật |
| Debug tạm IPN | — | `SEPAY_IPN_VERIFY=false` **chỉ local**, tắt trước khi deploy |

---

*Tài liệu này phản ánh codebase SOLE tại nhánh `main` (08/2026). Khi thêm tính năng: cập nhật mục 6, 11, 18 và §20 handover.*
