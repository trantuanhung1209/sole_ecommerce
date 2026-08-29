# Shoe E-commerce Specification

Tai lieu nay la dac ta day du cho website e-commerce ban giay dep, duoc thiet ke dua tren cac ky thuat tot co the tai su dung tu project Booking Tour cu, nhung domain va workflow duoc xay moi dung ban chat e-commerce.

## 1. Product Overview

Website Shoe E-commerce cho phep khach hang xem, tim kiem, loc, mua giay/dep theo product variant nhu size, mau, SKU; quan ly gio hang, checkout, thanh toan, theo doi don hang, danh gia san pham va yeu cau doi/tra/hoan tien.

He thong co khu admin/staff de quan ly catalog, ton kho, don hang, thanh toan, khach hang, danh gia, voucher, return/refund va bao cao doanh thu.

### Muc tieu

- Khach hang mua giay nhanh, ro size/mau/con hang.
- Giam loi oversell bang stock reservation.
- Payment webhook an toan, idempotent.
- Admin quan ly product/inventory/order de dang.
- Co nen tang mo rong cho promotion, shipping, recommendation, AI shopping assistant.

### Ngoai pham vi MVP

- Marketplace nhieu nha ban.
- Multi-currency.
- Loyalty point phuc tap.
- Recommendation AI nang cao.
- ERP/WMS integration that.

## 2. Roles & Permissions

| Role | Mo ta | Quyen chinh |
| --- | --- | --- |
| GUEST | Chua dang nhap | Xem product, search/filter, xem review public |
| CUSTOMER | Khach hang | Cart, checkout, order history, address, review, wishlist, return request |
| STAFF | Nhan vien | Xu ly order, support customer, tao product draft, xu ly return buoc dau |
| SHOP_MANAGER | Quan ly shop | Duyet product, quan ly inventory, duyet refund/return, xem report |
| ADMIN | Quan tri | Quan ly user, role, system config, full admin |
| SUPER_ADMIN | Chu he thong | Tat ca quyen, sua permission cua cac role tren UI, audit/security settings |

### Permission matrix MVP

| Feature | Guest | Customer | Staff | Shop Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Browse products | Yes | Yes | Yes | Yes | Yes |
| Add to cart | No/guest cart optional | Yes | Yes | Yes | Yes |
| Checkout | No | Yes | Yes | Yes | Yes |
| View own orders | No | Yes | Yes | Yes | Yes |
| Manage all orders | No | No | Limited | Yes | Yes |
| Manage products | No | No | Draft/Edit | Approve/Edit | Yes |
| Manage inventory | No | No | View | Yes | Yes |
| Process return | No | Own request | Confirm/Reject | Approve/Reject | Yes |
| Manage users | No | Own profile | No | No | Yes |
| Manage role permissions | No | No | No | No | SUPER_ADMIN only |
| Reports | No | No | Limited | Yes | Yes |

### Dynamic RBAC Management

`SUPER_ADMIN` co quyen quan ly permission cua cac role tren UI admin. He thong khong chi hard-code role trong code, ma can co bang/collection role-permission de UI co the bat/tat quyen.

Core rules:

- Chi `SUPER_ADMIN` duoc xem va cap nhat permission matrix.
- `SUPER_ADMIN` khong duoc tu remove quyen `MANAGE_ROLE_PERMISSIONS` cua role `SUPER_ADMIN`.
- Khong duoc xoa role system mac dinh: `CUSTOMER`, `STAFF`, `SHOP_MANAGER`, `ADMIN`, `SUPER_ADMIN`.
- Moi thay doi permission phai ghi audit log: ai sua, role nao, permission nao, gia tri cu/moi, thoi gian.
- Permission cache trong Redis neu co phai invalidate sau khi update.
- User dang dang nhap nen duoc ap dung permission moi o request tiep theo hoac sau khi refresh token/profile.

Suggested permission groups:

```text
CATALOG_READ
CATALOG_CREATE
CATALOG_UPDATE
CATALOG_DELETE
CATALOG_APPROVE
INVENTORY_READ
INVENTORY_UPDATE
ORDER_READ
ORDER_UPDATE
ORDER_CANCEL
PAYMENT_READ
PAYMENT_REFUND
RETURN_READ
RETURN_PROCESS
REVIEW_MODERATE
USER_READ
USER_UPDATE
USER_DISABLE
REPORT_READ
SYSTEM_SETTINGS
MANAGE_ROLE_PERMISSIONS
AUDIT_LOG_READ
```

## 3. Technology Recommendation

Nen tiep tuc dung stack hien tai neu muon migration nhanh:

### Backend

- Java 17.
- Spring Boot.
- Spring Web.
- Spring Security.
- Spring Data MongoDB.
- Redis.
- Gradle.
- Cloudinary or compatible object storage.
- SePay adapter hoac payment gateway tuong duong.
- Thymeleaf email templates.

### Frontend

- React + TypeScript.
- Vite.
- React Router.
- Redux Toolkit cho auth/global state.
- Axios with credentials.
- React Hook Form + Zod.
- Tailwind CSS + Radix/shadcn-style components.
- React Toastify.

### Can bo sung

- API docs: OpenAPI/Swagger.
- Testing: JUnit/Mockito/Testcontainers backend, Vitest/React Testing Library frontend.
- Logging correlation ID.
- Secret management qua env.
- Rate limiting.
- OpenAI API integration server-side cho AI shopping assistant.

## 4. Architecture

Backend nen theo feature-based layered modular monolith.

```text
be/src/main/java/www/
  common/
    exception/
    pagination/
    response/
    validation/
    audit/
  config/
  security/
  infrastructure/
    redis/
    mail/
    storage/
    payment/
    ai/
    scheduler/
  modules/
    auth/
    users/
    catalog/
    inventory/
    cart/
    checkout/
    orders/
    payments/
    reviews/
    wishlist/
    returns/
    notifications/
    admin/
    ai/
```

Moi module nen co:

```text
controller/
service/
repository/
dto/
mapper/
model/
```

Frontend nen theo feature-based:

```text
fe/src/
  app/
    routes/
    store/
    providers/
  shared/
    ui/
    api/
    hooks/
    schemas/
    types/
    utils/
  features/
    auth/
    catalog/
    cart/
    checkout/
    orders/
    account/
    admin/
    reviews/
    wishlist/
    returns/
```

## 5. Core Domain Model

### Product

San pham cha, vi du "Nike Air Force 1".

Fields:

```text
productId
name
slug
description
shortDescription
brandId
categoryIds
genderTarget: MEN/WOMEN/UNISEX/KIDS
material
careInstruction
status: DRAFT/PENDING_APPROVAL/APPROVED/REJECTED/PUBLISHED/UNPUBLISHED
publicStatus: DRAFT/PUBLISHED/HIDDEN
createdBy
approvedBy
approvedAt
rejectionReason
deleted
createdAt
updatedAt
```

### Product Variant

Bien the san pham theo size/mau/SKU.

```text
variantId
productId
sku
size
colorName
colorHex
price
compareAtPrice
costPrice optional
weight
status: ACTIVE/INACTIVE
imageUrls optional
createdAt
updatedAt
```

Example:

```text
Product: Nike Air Force 1
Variants:
- NAF1-WHT-40 | White | Size 40 | 2,500,000 VND
- NAF1-WHT-41 | White | Size 41 | 2,500,000 VND
- NAF1-BLK-40 | Black | Size 40 | 2,550,000 VND
- NAF1-BLK-41 | Black | Size 41 | 2,550,000 VND
```

### Inventory

Ton kho theo variant va warehouse.

```text
inventoryId
variantId
warehouseId
onHand
reserved
sold
available
version
updatedAt
```

Rule:

```text
available = onHand - reserved - sold
```

### Stock Reservation

Giu hang tam thoi trong checkout/payment.

```text
reservationId
orderId
variantId
quantity
status: ACTIVE/CONFIRMED/RELEASED/EXPIRED
expiresAt
createdAt
updatedAt
```

### Cart

```text
cartId
userId
status: ACTIVE/CHECKED_OUT/ABANDONED
items[]
createdAt
updatedAt
```

Cart item:

```text
cartItemId
variantId
quantity
priceSnapshot
addedAt
```

### Order

```text
orderId
orderCode
userId
status
paymentStatus
fulfillmentStatus
shippingAddressSnapshot
billingAddressSnapshot
subtotal
discountTotal
shippingFee
taxTotal
grandTotal
customerNote
cancelReason
createdAt
updatedAt
paidAt
cancelledAt
completedAt
```

Order status:

```text
PENDING_PAYMENT
PAID
CONFIRMED
PROCESSING
SHIPPED
DELIVERED
COMPLETED
CANCELLED
RETURN_REQUESTED
RETURNED
REFUNDED
```

Payment status:

```text
UNPAID
PENDING
COMPLETED
FAILED
CANCELLED
EXPIRED
REFUNDED
PARTIALLY_REFUNDED
```

Fulfillment status:

```text
UNFULFILLED
PROCESSING
SHIPPED
DELIVERED
RETURNED
```

### Order Item

Phai snapshot thong tin san pham tai thoi diem mua.

```text
orderItemId
orderId
productId
variantId
skuSnapshot
productNameSnapshot
brandNameSnapshot
sizeSnapshot
colorSnapshot
imageSnapshot
unitPrice
quantity
discountAmount
lineTotal
reviewed
returnStatus
```

### Payment

```text
paymentId
orderId
orderCode
orderInvoiceNumber
amount
currency
method: SEPAY/COD/VNPAY/MOMO/CARD
status
paymentUrl
successUrl
errorUrl
cancelUrl
transactionId
gatewayResponse
paidAt
failedAt
cancelledAt
expiredAt
createdAt
updatedAt
```

### Payment Event

Dung de idempotency webhook.

```text
paymentEventId
gateway
orderInvoiceNumber
transactionId
eventType
rawPayload
signature
processed
processedAt
createdAt
```

Unique:

```text
gateway + transactionId
gateway + orderInvoiceNumber + eventType
```

### Address

```text
addressId
userId
recipientName
phone
province
district
ward
street
postalCode optional
isDefault
createdAt
updatedAt
```

### Role

```text
roleId
code: CUSTOMER/STAFF/SHOP_MANAGER/ADMIN/SUPER_ADMIN
name
description
systemRole: true/false
active
createdAt
updatedAt
```

### Permission

```text
permissionId
code
name
description
group
createdAt
updatedAt
```

### Role Permission

```text
rolePermissionId
roleCode
permissionCode
enabled
updatedBy
updatedAt
```

Rule:

- Backend authorization nen doc permission tu DB/cache thay vi chi check enum role.
- `SUPER_ADMIN` luon co tat ca permission.
- Permission critical nhu `MANAGE_ROLE_PERMISSIONS` khong duoc tat cho `SUPER_ADMIN`.

### Review

```text
reviewId
userId
productId
orderId
orderItemId
rating
comment
images
helpfulCount
votedUserIds
replies
isVisible
createdAt
updatedAt
```

Rule:

- Customer chi review neu order item da DELIVERED/COMPLETED.
- Moi order item chi review 1 lan.

### Wishlist

```text
wishlistId
userId
productId
createdAt
```

### Return Request / RMA

```text
returnRequestId
orderId
orderItemIds
userId
reason
description
images
status: PENDING/STAFF_CONFIRMED/REJECTED/APPROVED/RECEIVED/REFUNDED/CLOSED
refundAmount
staffNote
adminNote
processedBy
approvedBy
createdAt
updatedAt
```

## 6. Database Collections

MVP collections:

```text
users
roles
permissions
role_permissions
products
product_variants
categories
brands
product_images
warehouses
inventory
stock_reservations
carts
orders
payments
payment_events
addresses
reviews
wishlists
notifications
return_requests
audit_logs
```

### Required indexes

```text
users.email unique
roles.code unique
permissions.code unique
role_permissions.roleCode + permissionCode unique
products.slug unique
products.status
products.publicStatus
products.brandId
products.categoryIds
product_variants.sku unique
product_variants.productId
inventory.variantId + warehouseId unique
stock_reservations.orderId
stock_reservations.expiresAt
carts.userId + status
orders.userId + createdAt
orders.orderCode unique
orders.status
payments.orderInvoiceNumber unique
payments.transactionId sparse unique
payment_events.gateway + transactionId unique
reviews.productId + createdAt
reviews.orderItemId unique
wishlists.userId + productId unique
```

## 7. API Specification

Base URL:

```text
/api
```

Response format:

```json
{
  "status": 200,
  "message": "Success",
  "data": {}
}
```

Pagination format:

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

### Auth APIs

```text
POST /auth/register
POST /auth/verify-otp
POST /auth/login
POST /auth/google
POST /auth/refresh
POST /auth/logout
GET  /auth/me
PUT  /auth/profile
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/change-password
GET  /auth/sessions
DELETE /auth/sessions/{sessionId}
DELETE /auth/sessions
```

### Role & Permission APIs

Chi `SUPER_ADMIN` duoc goi cac API update permission.

```text
GET /admin/roles
GET /admin/permissions
GET /admin/roles/{roleCode}/permissions
PUT /admin/roles/{roleCode}/permissions
POST /admin/roles/{roleCode}/permissions/{permissionCode}/enable
POST /admin/roles/{roleCode}/permissions/{permissionCode}/disable
GET /admin/role-permissions/matrix
PUT /admin/role-permissions/matrix
```

Request update permission cho 1 role:

```json
{
  "permissions": [
    { "code": "CATALOG_CREATE", "enabled": true },
    { "code": "ORDER_CANCEL", "enabled": false }
  ],
  "reason": "Adjust staff access for new workflow"
}
```

Response matrix:

```json
{
  "roles": ["CUSTOMER", "STAFF", "SHOP_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "permissions": [
    {
      "code": "CATALOG_CREATE",
      "group": "CATALOG",
      "enabledByRole": {
        "CUSTOMER": false,
        "STAFF": true,
        "SHOP_MANAGER": true,
        "ADMIN": true,
        "SUPER_ADMIN": true
      }
    }
  ]
}
```

### Product Catalog APIs

Public:

```text
GET /products
GET /products/{slugOrId}
GET /products/{productId}/variants
GET /categories
GET /brands
GET /products/search
GET /products/{productId}/reviews
```

Admin/staff:

```text
POST /admin/products
PUT /admin/products/{productId}
DELETE /admin/products/{productId}
POST /admin/products/{productId}/restore
POST /admin/products/{productId}/approve
POST /admin/products/{productId}/reject
POST /admin/products/{productId}/publish
POST /admin/products/{productId}/unpublish

POST /admin/products/{productId}/variants
PUT /admin/products/{productId}/variants/{variantId}
DELETE /admin/products/{productId}/variants/{variantId}

POST /admin/categories
PUT /admin/categories/{categoryId}
DELETE /admin/categories/{categoryId}

POST /admin/brands
PUT /admin/brands/{brandId}
DELETE /admin/brands/{brandId}
```

### Inventory APIs

Admin/manager:

```text
GET /admin/inventory
GET /admin/inventory/{variantId}
PUT /admin/inventory/{variantId}/adjust
POST /admin/inventory/import
GET /admin/inventory/low-stock
```

Internal service:

```text
POST /inventory/reserve
POST /inventory/confirm-reservation
POST /inventory/release-reservation
POST /inventory/expire-reservations
```

### Cart APIs

```text
GET /cart
POST /cart/items
PUT /cart/items/{cartItemId}
DELETE /cart/items/{cartItemId}
DELETE /cart
POST /cart/validate
```

### Checkout APIs

```text
POST /checkout/preview
POST /checkout
```

`/checkout/preview` tinh tien nhung chua tao order/reserve stock.  
`/checkout` validate lai, reserve stock, tao order, tao payment.

### Order APIs

Customer:

```text
GET /orders/my-orders
GET /orders/{orderId}
POST /orders/{orderId}/cancel
```

Admin/staff:

```text
GET /admin/orders
GET /admin/orders/{orderId}
PUT /admin/orders/{orderId}/status
POST /admin/orders/{orderId}/confirm
POST /admin/orders/{orderId}/ship
POST /admin/orders/{orderId}/deliver
POST /admin/orders/{orderId}/cancel
```

### Payment APIs

```text
POST /payments/checkout
GET /payments/{paymentId}
GET /payments/order/{orderId}
POST /payments/sepay/callback
GET /payments/sepay/callback
POST /payments/reconcile
```

Callback phai:

- Verify signature neu gateway ho tro.
- Check idempotency.
- Khong tin amount/status tu FE.
- Lay payment/order tu DB de doi chieu.

### Review APIs

```text
POST /reviews
GET /products/{productId}/reviews
PUT /reviews/{reviewId}
DELETE /reviews/{reviewId}
POST /reviews/{reviewId}/vote
POST /reviews/{reviewId}/reply
PUT /admin/reviews/{reviewId}/visibility
```

### Wishlist APIs

```text
GET /wishlist
POST /wishlist/{productId}
DELETE /wishlist/{productId}
```

### Return/RMA APIs

Customer:

```text
POST /returns
GET /returns/my-returns
GET /returns/{returnRequestId}
```

Staff/admin:

```text
GET /admin/returns
GET /admin/returns/{returnRequestId}
POST /admin/returns/{returnRequestId}/staff-confirm
POST /admin/returns/{returnRequestId}/reject
POST /admin/returns/{returnRequestId}/approve
POST /admin/returns/{returnRequestId}/mark-received
POST /admin/returns/{returnRequestId}/refund
```

## 8. Main Business Flows

### Browse and filter products

```text
User
-> Product listing
-> Filter by category, brand, size, color, price, gender, in-stock
-> Sort by newest, price, popularity, rating
-> Open product detail
-> Select size/color
-> See stock status
```

### Add to cart

```text
Customer selects variant
-> FE validates size/color selected
-> POST /cart/items
-> BE validates variant active
-> BE validates available stock > 0
-> Add or merge quantity
-> Return cart summary
```

### Checkout

```text
Customer opens checkout
-> Select address
-> Choose payment method
-> Preview price
-> Submit checkout
-> BE reloads cart from DB
-> Validate all products/variants
-> Validate stock
-> Calculate final price
-> Create stock reservations with TTL
-> Create order PENDING_PAYMENT
-> Create payment PENDING
-> Return payment checkout data
```

### Payment success webhook

```text
Gateway callback
-> Verify payload/signature
-> Insert payment event with unique transaction
-> If duplicate: return success immediately
-> Load payment by invoice
-> Validate amount/order
-> Update payment COMPLETED
-> Update order PAID/CONFIRMED
-> Confirm stock reservation
-> Send email/notification
```

### Payment failed

```text
Gateway callback failed/cancelled
-> Insert payment event
-> Update payment FAILED/CANCELLED
-> Update order PAYMENT_FAILED or CANCELLED
-> Release reservation
-> Notify customer
```

### Payment timeout

```text
Scheduled job every 1-5 minutes
-> Find PENDING payments expired
-> Mark payment EXPIRED
-> Mark order CANCELLED
-> Release reservations
```

### Fulfillment

```text
Admin confirms paid order
-> status CONFIRMED
-> Staff packs order
-> status PROCESSING
-> Ship with tracking code
-> status SHIPPED
-> Mark delivered
-> status DELIVERED
-> After return window passes
-> status COMPLETED
```

### Return/refund

```text
Customer selects delivered order item
-> Submit reason/images
-> Staff confirms eligibility
-> Manager/Admin approves
-> Customer returns item
-> Staff marks received
-> Refund processed
-> Order/payment updated
```

## 9. Pricing & Promotion Rules

### Base price

- Gia hien thi lay tu product variant.
- Order item phai snapshot `unitPrice`.
- Khong tinh tien tu client.

### Discount

MVP co the chua can voucher. Neu co:

```text
Voucher types:
- PERCENTAGE
- FIXED_AMOUNT
- FREE_SHIPPING
```

Validation:

- Time window.
- Min order amount.
- Max discount.
- Usage limit.
- Per-user usage limit.
- Product/category applicability.

### Shipping fee

MVP:

- Fixed fee by province or flat fee.
- Free shipping threshold optional.

Phase 2:

- Shipping provider API.
- Tracking.

## 10. Inventory Rules

Khong duoc oversell.

Reserve stock khi checkout:

```text
if inventory.available >= quantity:
  inventory.reserved += quantity
  inventory.available -= quantity
  create reservation ACTIVE
else:
  reject checkout
```

Payment success:

```text
reservation ACTIVE -> CONFIRMED
inventory.reserved -= quantity
inventory.sold += quantity
```

Payment failed/timeout:

```text
reservation ACTIVE -> RELEASED/EXPIRED
inventory.reserved -= quantity
inventory.available += quantity
```

Can dung atomic update hoac optimistic locking:

```text
where variantId = ?
and available >= requestedQty
and version = ?
```

## 11. Security Requirements

### Authentication

- Access token in HttpOnly cookie.
- Refresh token in HttpOnly cookie.
- Refresh session stored in Redis.
- Refresh token rotation recommended.
- Logout blacklists access token.
- Logout all devices deletes all user sessions.

### Cookie policy

Development:

```text
Secure=false
SameSite=Lax
```

Production:

```text
Secure=true
HttpOnly=true
SameSite=Lax or Strict
Domain configured by env
```

### CSRF

Vi dung cookie auth, state-changing APIs can CSRF protection:

```text
POST/PUT/PATCH/DELETE require CSRF token
GET safe and no mutation
```

### Rate limiting

Can rate limit:

- Login.
- Register.
- OTP verify/resend.
- Forgot password.
- Checkout.
- Payment callback basic abuse protection.

### Upload security

- Validate MIME.
- Validate file size.
- Validate image dimensions.
- Strip dangerous metadata if possible.
- Separate folders: `products`, `variants`, `reviews`, `avatars`.

### Payment security

- Verify gateway signature.
- Idempotency event table.
- Validate amount/currency/order status.
- Never update payment from frontend success page directly.
- Callback endpoint logs raw payload safely.

## 12. Frontend UX Specification

### Public pages

- Home.
- Product listing.
- Product detail.
- Category page.
- Search results.
- Login/register/forgot password.

### Customer pages

- Profile.
- Address book.
- Cart.
- Checkout.
- Payment result.
- My orders.
- Order detail.
- Wishlist.
- My reviews.
- Return requests.

### Admin/staff pages

- Dashboard.
- Product management.
- Product approval.
- Variant management.
- Inventory management.
- Order management.
- Return/refund management.
- Review moderation.
- Customer management.
- Report/revenue.

### Product detail requirements

- Image gallery.
- Brand/category.
- Price and compare price.
- Size selector.
- Color selector.
- Stock status per selected variant.
- Quantity stepper.
- Add to cart.
- Buy now.
- Reviews.
- Related products.

### Cart requirements

- Update quantity.
- Remove item.
- Show invalid/out-of-stock item.
- Price summary.
- Checkout button disabled if cart invalid.

### Checkout requirements

- Address selector.
- Shipping method.
- Payment method.
- Order summary.
- Voucher input optional.
- Clear validation errors.

## 13. Admin Specification

### Product admin

Staff creates product draft:

```text
DRAFT -> PENDING_APPROVAL
```

Manager/admin approves:

```text
PENDING_APPROVAL -> APPROVED -> PUBLISHED
```

Reject:

```text
PENDING_APPROVAL -> REJECTED with reason
```

Product cannot be hard-deleted if it has order items.

### Inventory admin

Actions:

- View stock by variant.
- Adjust stock in/out.
- Set low-stock threshold.
- View reservation list.
- View inventory audit log.

### Order admin

Actions:

- Filter by status/payment/date/customer.
- Confirm order.
- Update fulfillment.
- Cancel order with reason.
- Export order report.

### Return/refund admin

Workflow:

```text
PENDING
-> STAFF_CONFIRMED or REJECTED
-> APPROVED or REJECTED
-> RECEIVED
-> REFUNDED
-> CLOSED
```

### Role permission admin

Chi `SUPER_ADMIN` thay menu nay.

UI requirements:

- Man hinh permission matrix: hang la permission, cot la role.
- Co filter theo group: Catalog, Inventory, Order, Payment, Return, User, Report, System.
- Toggle permission truc tiep bang switch/checkbox.
- Co nut Save changes, Reset changes.
- Hien diff truoc khi save.
- Bat buoc nhap reason khi thay doi permission critical.
- Disable toggle `SUPER_ADMIN -> MANAGE_ROLE_PERMISSIONS`.
- Hien audit history cua moi role.

Flow:

```text
SUPER_ADMIN
-> Admin / Roles & Permissions
-> Load role-permission matrix
-> Toggle permissions
-> Save with reason
-> Backend validates safety rules
-> Persist role_permissions
-> Invalidate permission cache
-> Write audit log
-> UI reloads matrix
```

## 14. Notification & Mail

Email templates MVP:

- OTP verification.
- Reset password.
- Order confirmation.
- Payment success.
- Payment failed/expired.
- Order shipped.
- Order delivered.
- Return request received.
- Return approved/rejected.
- Refund completed.

Notification entity:

```text
notificationId
userId
type
title
message
targetUrl
read
createdAt
```

## 15. Search & Filter

MVP search with Mongo regex/text index:

- keyword name/description/brand.
- category.
- brand.
- size.
- color.
- price range.
- in stock.
- gender.
- sort.

Phase 2:

- Elasticsearch/OpenSearch/Meilisearch.
- Synonym: sneaker, running, sandal, boots.
- Vietnamese full-text normalization.

## 16. AI Shopping Assistant With OpenAI API

Phan AI cua Shoe E-commerce se dung OpenAI API lam provider chinh. Khong goi OpenAI truc tiep tu frontend. Frontend chi goi backend API cua he thong; backend giu `OPENAI_API_KEY`, build context, goi OpenAI va tra ket qua ve UI.

Theo official OpenAI documentation, API key la secret va phai duoc load an toan tu environment variable hoac key management service o server-side, khong expose trong browser/mobile client.

### Use cases

- Tu van size giay theo thong tin chan/brand/form giay.
- Goi y san pham theo nhu cau: running, sneaker, sandal, office, school.
- Tra loi cau hoi ve san pham, chat lieu, bao quan.
- Kiem tra trang thai don hang cua customer da dang nhap.
- Giai thich chinh sach thanh toan, doi tra, hoan tien.
- Ho tro search tu nhien: "giay chay bo nam size 42 duoi 2 trieu".

### AI routes

Routes:

```text
PRODUCT_INFO
SIZE_ADVICE
ORDER_STATUS
PAYMENT_REFUND_POLICY
RETURN_POLICY
CHITCHAT
WEBSEARCH
```

### Data source

- Products.
- Variants.
- Size guide.
- Policies.
- User orders if authenticated.

Khong nen reuse prompt travel cu. Viet prompt moi theo e-commerce.

### Backend module

```text
modules/ai/
  controller/AiChatController.java
  service/AiChatService.java
  service/AiRouterService.java
  service/ProductContextService.java
  dto/AiChatRequest.java
  dto/AiChatResponse.java
  model/AiConversation.java
  model/AiMessage.java

infrastructure/ai/
  OpenAiClientConfig.java
  OpenAiChatAdapter.java
  OpenAiEmbeddingAdapter.java optional
```

### API endpoints

```text
POST /ai/chat
GET /ai/conversations
GET /ai/conversations/{conversationId}
DELETE /ai/conversations/{conversationId}
POST /ai/conversations/{conversationId}/messages
```

Request:

```json
{
  "conversationId": "optional",
  "message": "Toi di giay Nike size 42, Adidas nen chon size nao?",
  "context": {
    "productId": "optional",
    "variantId": "optional"
  }
}
```

Response:

```json
{
  "conversationId": "conv_123",
  "routeType": "SIZE_ADVICE",
  "answer": "Voi Adidas, ban co the bat dau tu size 42 2/3...",
  "suggestedProducts": [],
  "warnings": []
}
```

### OpenAI request strategy

Nen dung Responses API cho project moi. Backend adapter chiu trach nhiem:

- Gan model qua env `OPENAI_MODEL`.
- Truyen system/developer instruction ve gioi han domain shoe e-commerce.
- Dua context san pham/order/policy da duoc filter vao prompt.
- Khong dua password, token, payment secret, raw PII khong can thiet vao OpenAI.
- Timeout va retry co gioi han.
- Log metadata, khong log full prompt neu co PII.

Pseudo flow:

```text
FE Chat Widget
-> POST /api/ai/chat
-> Jwt optional authentication
-> AiRouterService classify intent
-> ProductContextService fetch relevant product/order/policy data
-> OpenAiChatAdapter call OpenAI API
-> Save conversation/message
-> Return answer + suggested products
```

### Prompt boundaries

AI assistant phai:

- Chi tu van trong pham vi shoe e-commerce.
- Khong tu y xac nhan don hang/thanh toan/hoan tien.
- Khi can hanh dong that, tra ve CTA/link de user/admin thuc hien qua API/UI.
- Khong dua loi khuyen y te chan nghiem trong; neu dau chan/chan thuong, khuyen hoi chuyen gia y te.
- Neu khong ro size, hoi them thong tin: chieu dai ban chan, brand dang mang, form mong muon.

### Privacy and retention

- Conversation co the luu trong MongoDB de hien lich su chat.
- Cho phep customer xoa conversation.
- Khong gui access token, refresh token, password, payment secret sang OpenAI.
- Neu cau hoi ve order, backend chi lay order cua user dang nhap va rut gon fields can thiet.

### Optional semantic search

Neu can semantic search:

- Dung OpenAI embeddings cho product name, description, tags, brand, category, material.
- Luu vector vao vector store rieng.
- Re-index khi product published/updated/unpublished.
- Search flow: natural query -> embedding -> top products -> filter in-stock/public -> return.

## 17. Testing Strategy

Backend tests:

- Auth login/refresh/logout.
- OTP expiry.
- Product CRUD/approval.
- Variant SKU unique.
- Add to cart validation.
- Checkout stock reservation.
- Payment webhook idempotency.
- Payment timeout release stock.
- Order status transitions.
- Review only after delivered order item.
- Return/refund workflow.

Frontend tests:

- Login/register form validation.
- Product filter.
- Variant selection.
- Cart quantity.
- Checkout validation.
- Protected routes.
- Admin status update dialogs.

Critical integration tests:

```text
Checkout success reserves stock exactly once.
Duplicate payment webhook does not double deduct stock.
Payment timeout releases stock.
Two concurrent checkout requests cannot oversell.
```

## 18. Non-functional Requirements

### Performance

- Product list paginated.
- Product images optimized/CDN.
- Cache hot products/categories in Redis.
- Avoid N+1 enrichment in admin lists.
- Debounce search input.

### Reliability

- Idempotent payment webhook.
- Scheduled reconciliation job.
- Reservation expiry job.
- Audit logs for inventory/payment/order changes.

### Observability

- Request correlation ID.
- Structured logs.
- Payment callback logs.
- Error logs with stack trace server-side only.
- Admin audit trail.

### Maintainability

- Service per use case where flow is complex.
- No service over 400-500 lines unless justified.
- DTO per boundary.
- Mapper isolated.
- Business rule in domain/service, not controller.

## 19. Environment Variables

Backend:

```text
SERVER_PORT
MONGODB_URI
REDIS_HOST
REDIS_PORT
JWT_SECRET
JWT_ACCESS_EXPIRATION
JWT_REFRESH_EXPIRATION
COOKIE_DOMAIN
COOKIE_SECURE
COOKIE_SAME_SITE
MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SEPAY_API_URL
SEPAY_MERCHANT_ID
SEPAY_SECRET_KEY
FRONTEND_BASE_URL
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_EMBEDDING_MODEL
OPENAI_TIMEOUT_MS
```

Frontend:

```text
VITE_API_URL
VITE_GOOGLE_CLIENT_ID
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

## 20. MVP Implementation Order

1. Common backend: response, exception, pagination, config, security.
2. Auth/User/Role.
3. Catalog: category, brand, product, variant, image.
4. Inventory with atomic reservation.
5. Cart.
6. Checkout preview and checkout.
7. Order.
8. Payment adapter and webhook idempotency.
9. Address.
10. Review verified purchase.
11. Wishlist.
12. Admin dashboards/tables.
13. Return/refund.
14. Tests and hardening.

## 21. Definition of Done

MVP duoc xem la hoan thanh khi:

- Customer co the dang ky, login, refresh session, logout.
- Customer xem product, chon size/mau, add cart.
- Checkout tao order va reserve stock.
- Payment success cap nhat order/payment va deduct stock dung 1 lan.
- Payment failed/timeout release stock.
- Customer xem order history/detail.
- Admin quan ly product/variant/inventory/order.
- Review chi tao duoc sau khi don delivered/completed.
- Return/refund co workflow toi thieu.
- Khong con secrets hard-code.
- Co test cho checkout, payment webhook, inventory concurrency.
