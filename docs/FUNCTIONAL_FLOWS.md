# SOLE — Sơ đồ luồng chức năng

> Tài liệu trực quan mô tả **luồng nghiệp vụ thực tế** (đối chiếu code tại `main`, 08/2026).  
> Chi tiết API/model: [`SHOE_ECOMMERCE_SPECIFICATION.md`](./SHOE_ECOMMERCE_SPECIFICATION.md)  
> Return/refund sâu: [`RETURN_REFUND_SPEC.md`](./RETURN_REFUND_SPEC.md) · Runbook: [`RUNBOOK_REFUND.md`](./RUNBOOK_REFUND.md)

---

## Mục lục

1. [Bản đồ module](#1-bản-đồ-module)
2. [Xác thực & phiên](#2-xác-thực--phiên)
3. [Duyệt sản phẩm & giỏ hàng](#3-duyệt-sản-phẩm--giỏ-hàng)
4. [Checkout & thanh toán SePay](#4-checkout--thanh-toán-sepay)
5. [Vận hành đơn hàng](#5-vận-hành-đơn-hàng)
6. [Đổi / trả / hoàn tiền](#6-đổi--trả--hoàn-tiền)
7. [Duyệt sản phẩm (catalog)](#7-duyệt-sản-phẩm-catalog)
8. [Tồn kho & scheduler](#8-tồn-kho--scheduler)
9. [Thông báo real-time](#9-thông-báo-real-time)
10. [Đánh giá sản phẩm](#10-đánh-giá-sản-phẩm)
11. [Upload ảnh khách hàng](#11-upload-ảnh-khách-hàng)
12. [Báo cáo admin](#12-báo-cáo-admin)
13. [Trợ lý AI](#13-trợ-lý-ai)

---

## 1. Bản đồ module

```mermaid
flowchart TB
  subgraph Customer["Khách hàng (Guest / Customer)"]
    Browse["Duyệt SP / PDP"]
    Cart["Giỏ hàng"]
    Checkout["Checkout"]
    Orders["Đơn hàng / Return"]
    AI["AI Chat"]
  end

  subgraph Backend["Spring Boot API"]
    Catalog["catalog/"]
    CartM["cart/"]
    CheckoutM["checkout/"]
    Payments["payments/ SePay IPN"]
    OrdersM["orders/"]
    Returns["returns/"]
    Inventory["inventory/"]
    Notif["notifications/ SSE"]
    Reports["reports/"]
  end

  subgraph Admin["Admin / Staff"]
    ProductAdmin["Sản phẩm & duyệt"]
    OrderAdmin["Đơn hàng"]
    ReturnAdmin["Trả hàng & hoàn tiền"]
    Dashboard["Dashboard"]
  end

  Browse --> Catalog
  Cart --> CartM
  Checkout --> CheckoutM
  Checkout --> Payments
  Orders --> OrdersM
  Orders --> Returns
  AI --> Backend

  ProductAdmin --> Catalog
  OrderAdmin --> OrdersM
  ReturnAdmin --> Returns
  Dashboard --> Reports
  CheckoutM --> Inventory
  Returns --> Inventory
  Payments --> Inventory
  Payments --> Notif
  Returns --> Notif
```

---

## 2. Xác thực & phiên

```mermaid
sequenceDiagram
  actor U as User
  participant FE as Frontend
  participant BE as Auth API
  participant Redis as Redis sessions

  U->>FE: Login email/password hoặc Google
  FE->>BE: POST /auth/login
  BE->>Redis: Lưu refresh session
  BE-->>FE: Set HttpOnly cookies (access + refresh)
  FE->>BE: GET /auth/me
  BE-->>FE: user + role + permissions[]

  Note over FE,BE: POST/PUT/PATCH/DELETE cần CSRF (X-XSRF-TOKEN)

  U->>FE: Logout
  FE->>BE: POST /auth/logout
  BE->>Redis: Revoke session / blacklist token

  Note over FE,BE: Guest cart: cookie guestSessionId<br/>Login → merge giỏ guest vào user
```

| Bước | Chi tiết |
|------|----------|
| Token | Access + refresh qua HttpOnly cookie |
| RBAC | `permissions[]` từ `/auth/me`; BE `@PreAuthorize` + `@perm.has` |
| Guest | Không token; giỏ qua `guestSessionId` |
| Checkout | **Bắt buộc đăng nhập** |

---

## 3. Duyệt sản phẩm & giỏ hàng

```mermaid
flowchart LR
  A["/products + filter URL"] --> B["Mongo / Elasticsearch"]
  B --> C["PDP: chọn variant"]
  C --> D{"Đăng nhập?"}
  D -->|Guest| E["POST /cart/items<br/>guestSessionId cookie"]
  D -->|User| F["POST /cart/items<br/>userId"]
  E --> G["POST /cart/validate"]
  F --> G
  G --> H{"Muốn checkout?"}
  H -->|Guest| I["/login?redirect=/checkout"]
  I --> J["Merge guest cart → user cart"]
  H -->|User| K["/checkout"]
  J --> K
```

| Quy tắc | Giá trị |
|---------|---------|
| Variant | Phải ACTIVE, `available > 0` |
| Validate | FE debounce sau đổi số lượng |
| Merge | `GuestCartMergeService` khi login |

---

## 4. Checkout & thanh toán SePay

### 4.1. Checkout

```mermaid
sequenceDiagram
  actor C as Customer
  participant FE as Checkout page
  participant BE as CheckoutService
  participant Inv as InventoryService
  participant Pay as EcommercePaymentService

  C->>FE: Chọn địa chỉ, coupon, ghi chú
  FE->>BE: POST /checkout/preview
  BE-->>FE: subtotal, discount, VAT, ship, grandTotal
  C->>FE: Xác nhận đặt hàng
  FE->>BE: POST /checkout
  BE->>BE: Tính lại giá (không tin FE)
  BE->>Inv: reserve stock (TTL ~15 phút)
  alt Hết hàng
    Inv-->>BE: reject
    BE-->>FE: 400
  else OK
    BE->>BE: Tạo Order PENDING_PAYMENT
    BE->>Pay: Tạo Payment PENDING + SePay form
    Pay-->>FE: paymentUrl / signed formData
    FE->>FE: Auto POST redirect SePay
  end
```

### 4.2. IPN thành công / thất bại

```mermaid
flowchart TD
  IPN["SePay POST /payments/sepay/callback"] --> Verify{"Verify chữ ký"}
  Verify -->|Fail| Reject["400 / ignore"]
  Verify -->|OK| Dup{"transactionId<br/>đã xử lý?"}
  Dup -->|Yes| OK["200 success (idempotent)"]
  Dup -->|No| Amt{"amount khớp?"}
  Amt -->|No| Err["Reject"]
  Amt -->|Yes| Status{"IPN status"}

  Status -->|Success| S1["Payment COMPLETED"]
  S1 --> S2["Order markPaid"]
  S2 --> S3["Confirm reservation → sold++"]
  S3 --> S4["Email + notification"]

  Status -->|Failed| F1["Payment FAILED"]
  F1 --> F2["Order CANCELLED"]
  F2 --> F3["Release reservation"]
  F3 --> F4["Email + notification"]

  Timer["Scheduler mỗi 5 phút"] --> Exp["expirePendingPayments"]
  Exp --> F1
```

| Thành phần | Quy tắc |
|------------|---------|
| Phí ship | 30.000đ; miễn phí nếu subtotal ≥ 2.000.000đ |
| VAT | `VatCalculator`, mặc định rate = 0 |
| Coupon | PERCENTAGE / FIXED / FREE_SHIPPING |
| FE success | Poll BE ~12s; không tin redirect URL |

---

## 5. Vận hành đơn hàng

### 5.1. Vòng đời trạng thái

```mermaid
stateDiagram-v2
  [*] --> PENDING_PAYMENT: checkout
  PENDING_PAYMENT --> PAID: IPN success
  PENDING_PAYMENT --> CANCELLED: fail/expire/hủy
  PAID --> CONFIRMED
  CONFIRMED --> PROCESSING
  PROCESSING --> SHIPPED: + trackingCode
  SHIPPED --> DELIVERED
  DELIVERED --> COMPLETED: auto sau 7 ngày hoặc thủ công
  DELIVERED --> RETURN_REQUESTED: khách tạo return
  RETURN_REQUESTED --> RETURNED: nhận hàng trả
  RETURNED --> REFUNDED: confirm refund
  COMPLETED --> RETURN_REQUESTED: trong 7 ngày giao
```

### 5.2. Luồng admin/staff

```mermaid
flowchart LR
  A["Admin order list"] --> B["Order detail"]
  B --> C{"Trạng thái hiện tại"}
  C -->|PAID| D["→ CONFIRMED"]
  C -->|CONFIRMED| E["→ PROCESSING"]
  C -->|PROCESSING| F["→ SHIPPED<br/>TrackingCodeDialog"]
  C -->|SHIPPED| G["→ DELIVERED"]
  C -->|DELIVERED| H["→ COMPLETED"]
  D & E & F & G & H --> I["Email shipped/delivered tương ứng"]
```

| Actor | Route |
|-------|-------|
| Staff/Admin | `/admin/orders`, `/staff/orders` |
| Chi tiết | `/admin/orders/:orderId` — items, payment, panel return |

---

## 6. Đổi / trả / hoàn tiền

> Spec đầy đủ: [`RETURN_REFUND_SPEC.md`](./RETURN_REFUND_SPEC.md)

### 6.1. State machine return

```mermaid
stateDiagram-v2
  [*] --> PENDING: POST /returns
  PENDING --> STAFF_CONFIRMED: staff-confirm
  PENDING --> REJECTED: reject ≥10 ký tự
  STAFF_CONFIRMED --> APPROVED: manager approve
  STAFF_CONFIRMED --> REJECTED: reject
  APPROVED --> RECEIVED: mark-received + itemCondition
  APPROVED --> REJECTED: quá hạn gửi (scheduler)
  RECEIVED --> REFUND_PENDING: request-refund
  REFUND_PENDING --> REFUNDED: confirm-refund + mã GD
  REJECTED --> [*]
  REFUNDED --> [*]
```

### 6.2. Luồng end-to-end (2 bên)

```mermaid
sequenceDiagram
  actor K as Khách
  actor S as Staff
  actor M as Manager
  participant BE as ReturnService
  participant Pay as PaymentService
  participant Inv as Inventory

  K->>BE: POST /returns (≤7 ngày sau giao)
  K->>BE: POST /media/images?folder=returns
  BE-->>K: PENDING + notification

  S->>BE: staff-confirm → STAFF_CONFIRMED
  M->>BE: approve → APPROVED<br/>shipBackDeadlineAt +7 ngày
  BE-->>K: notification + hạn gửi hàng

  K->>K: Gửi hàng về shop
  S->>BE: mark-received { itemCondition }
  alt GOOD
    BE->>Inv: restock
    BE-->>S: maxRefund = 100% lineTotal
  else DAMAGED
    BE-->>S: maxRefund = 50%, không restock
  else INCOMPLETE
    BE-->>S: maxRefund = 30%, không restock
  end

  M->>BE: request-refund → REFUND_PENDING
  BE->>Pay: markRefundPending (order chưa REFUNDED)
  BE-->>K: "đang xử lý hoàn tiền"

  M->>M: Chuyển khoản thực tế (CK/SePay/tiền mặt)
  M->>BE: confirm-refund { amount, transactionRef, method }
  BE->>BE: validate amount ≤ min(maxRefund, payment)
  BE->>Pay: markRefundCompleted
  BE-->>K: REFUNDED + mã GD
```

### 6.3. API bị chặn (bảo vệ shop)

`PUT /admin/returns/{id}/status` **không** cho phép:

| Status đích | Lý do |
|-------------|-------|
| `RECEIVED` | Phải dùng `POST .../mark-received` (bắt buộc `itemCondition`) |
| `REFUND_PENDING` | Phải dùng `POST .../request-refund` |
| `REFUNDED` | Phải dùng `POST .../confirm-refund` |

### 6.4. UI theo vai trò

```mermaid
flowchart TB
  subgraph CustomerUI["Khách — /returns"]
    C1["ReturnFlowStepper"]
    C2["Hạn gửi hàng nếu APPROVED"]
    C3["Trần hoàn sau kiểm tra hàng"]
    C4["REFUND_PENDING / REFUNDED + mã GD"]
  end

  subgraph AdminUI["Admin — /admin/returns"]
    A1["Filter theo status"]
    A2["ReturnRequestDetailPanel"]
    A3["MarkReceivedDialog"]
    A4["ConfirmRefundDialog"]
    A5["Banner cảnh báo overdue/stale"]
  end
```

---

## 7. Duyệt sản phẩm (catalog)

```mermaid
stateDiagram-v2
  [*] --> DRAFT: Staff tạo
  DRAFT --> PENDING_APPROVAL: submit
  PENDING_APPROVAL --> APPROVED: Manager duyệt
  PENDING_APPROVAL --> REJECTED: từ chối
  APPROVED --> PUBLISHED: publish
  PUBLISHED --> UNPUBLISHED: gỡ
  REJECTED --> DRAFT: sửa lại
```

| Actor | Hành động |
|-------|-----------|
| STAFF | Tạo/sửa DRAFT |
| SHOP_MANAGER+ | Approve / reject / publish |
| ADMIN | Toàn quyền catalog |

Ảnh catalog admin: `POST /admin/catalog/images` (role admin).  
Ảnh review/return khách: `POST /media/images?folder=reviews|returns` (authenticated customer).

---

## 8. Tồn kho & scheduler

### 8.1. Vòng đời tồn kho

```mermaid
flowchart TD
  subgraph Checkout["Checkout"]
    R1["available -= qty<br/>reserved += qty"]
    R2["Reservation ACTIVE<br/>expires ~15 phút"]
  end

  subgraph Paid["Thanh toán OK"]
    P1["reserved -= qty<br/>sold += qty"]
    P2["Reservation CONFIRMED"]
  end

  subgraph Fail["Fail / Expire"]
    F1["reserved -= qty<br/>available += qty"]
    F2["Reservation RELEASED"]
  end

  subgraph Return["Return GOOD"]
    RT1["sold -= qty<br/>onHand += qty<br/>available recalc"]
  end

  R1 --> R2
  R2 -->|IPN success| P1
  R2 -->|fail/expire job| F1
  RT1 -.->|mark-received GOOD| Return
```

### 8.2. Scheduler (`EcommerceScheduler`)

```mermaid
flowchart LR
  subgraph Every5min["Cron: */5 * * * *"]
    J1["expireReservations"]
    J2["expirePendingPayments"]
  end

  subgraph Hourly["Cron: 0 * * * *"]
    J3["autoCompleteDeliveredOrders(7 ngày)"]
    J4["expireOverdueShipBackReturns"]
  end

  subgraph Every30s["Cron: */30 * * * * *"]
    J5["SSE ping notifications"]
  end
```

---

## 9. Thông báo real-time

```mermaid
sequenceDiagram
  participant BE as NotificationService
  participant SSE as SSE Hub
  participant FE as useNotifications

  BE->>BE: create(userId, type, title, body, targetUrl)
  BE->>SSE: push event
  SSE-->>FE: event notification / unread_count
  FE->>FE: toast + refresh dropdown

  Note over FE: GET /notifications/stream (authenticated)<br/>Dropdown: 5 items/page<br/>Mark read / mark all read
```

| Sự kiện return | NotificationType |
|----------------|------------------|
| Tạo yêu cầu | RETURN_REQUESTED |
| Duyệt trả | RETURN_APPROVED |
| Từ chối | RETURN_REJECTED |
| Chấp nhận hoàn | REFUND_PENDING |
| Đã chuyển tiền | REFUND_COMPLETED |

---

## 10. Đánh giá sản phẩm

```mermaid
flowchart TD
  A["Order DELIVERED/COMPLETED"] --> B{"Item đã review?"}
  B -->|Chưa| C["POST /reviews<br/>orderId + orderItemId"]
  B -->|Rồi| D["Từ chối duplicate"]
  C --> E["Verified purchase badge"]
  C --> F["Optional: upload ảnh qua /media/images?folder=reviews"]
  G["Admin"] --> H["Reply / ẩn hiện review"]
```

---

## 11. Upload ảnh khách hàng

```mermaid
flowchart LR
  A["Customer authenticated"] --> B{"folder query param"}
  B -->|reviews| C["ecommerce/reviews"]
  B -->|returns| D["ecommerce/returns"]
  B -->|invalid| E["400"]
  C & D --> F["ImageUploadValidator<br/>max 4 ảnh, MIME/size"]
  F --> G["Cloudinary upload"]
  G --> H["Trả URL[] cho FE"]
```

| Endpoint | Ai dùng |
|----------|---------|
| `POST /media/images?folder=returns` | Customer (return minh chứng) |
| `POST /media/images?folder=reviews` | Customer (review) |
| `POST /admin/catalog/images` | Staff/Admin (catalog) |

---

## 12. Báo cáo admin

```mermaid
flowchart TB
  API["GET /admin/reports/dashboard?from=&to="] --> D["DashboardAdmin"]

  D --> M1["Doanh thu / đơn hàng / user / SP"]
  D --> M2["pendingReturns"]
  D --> M3["refundPendingReturns"]
  D --> M4["overdueApprovedReturns"]
  D --> M5["staleRefundPendingReturns"]

  M4 & M5 --> Alert["Banner cảnh báo + link /admin/returns"]
  M2 & M3 --> Cards["Stats cards đổi/trả"]
```

| Metric | Ý nghĩa vận hành |
|--------|------------------|
| `pendingReturns` | PENDING — cần staff xử lý |
| `refundPendingReturns` | Đã đồng ý hoàn, chờ chuyển tiền |
| `overdueApprovedReturns` | Khách chưa gửi hàng quá deadline |
| `staleRefundPendingReturns` | REFUND_PENDING > 3 ngày chưa confirm |

---

## 13. Trợ lý AI

```mermaid
flowchart TD
  U["User / Guest"] --> Chat["POST /ai/chat"]
  Chat --> Route{"routeType"}
  Route -->|CATALOG| R1["Embedding search sản phẩm"]
  Route -->|POLICY| R2["policies.yml return/payment/order"]
  Route -->|ORDER| R3["OrderService.mine nếu login"]
  Route -->|RETURN| R4["ReturnService.mine nếu login"]
  R1 & R2 & R3 & R4 --> Ans["answer + suggestedProducts + warnings"]
  Guest --> W["warnings: đăng nhập để xem đơn"]
```

---

## Phụ lục — Kiểm thử tự động (08/2026)

| Suite | Phạm vi |
|-------|---------|
| BE `./gradlew test` | ~90 tests (ReturnServiceTest, ReturnRefundPolicyTest, payment, checkout, …) |
| FE `npm run test` | 28 tests (returnFlow, commerce, cart, …) |
| FE `npm run build` | TypeScript + Vite production build |
| E2E Playwright | Smoke: home, products, cart (chưa cover return/checkout dài) |

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`SHOE_ECOMMERCE_SPECIFICATION.md`](./SHOE_ECOMMERCE_SPECIFICATION.md) | Spec tổng hợp API, model, RBAC |
| [`RETURN_REFUND_SPEC.md`](./RETURN_REFUND_SPEC.md) | Return/refund chi tiết + audit |
| [`RUNBOOK_REFUND.md`](./RUNBOOK_REFUND.md) | Hướng dẫn vận hành hoàn tiền |
| [`STAGING_CHECKLIST.md`](./STAGING_CHECKLIST.md) | Checklist deploy staging |
| [`UI_DESIGN_SYSTEM.md`](./UI_DESIGN_SYSTEM.md) | Design tokens / components |
