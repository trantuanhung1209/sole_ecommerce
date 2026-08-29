# Migration Analysis: Booking Tour -> Shoe E-commerce

Tai lieu nay tong hop phan tich source code hien tai de lam co so xay dung website e-commerce ban giay dep. Muc tieu khong phai doi ten domain Booking Tour mot cach may moc, ma la giu lai nhung ky thuat, pattern va infrastructure tot co the ap dung cho he thong ban hang.

## 1. Executive Summary

Du an hien tai la full-stack Booking Tour gom:

- Backend: Spring Boot 3.5.4, Java 17, MongoDB, Redis, Spring Security, JWT, Mail, Cloudinary, SePay, Spring AI.
- Frontend: React 19, TypeScript, Vite, Redux Toolkit, React Router, Axios, React Hook Form, Zod, Tailwind CSS v4, Radix/shadcn-style UI.

Nen giu lai:

- Auth/session voi JWT cookie, refresh session Redis, OTP email.
- RBAC bang Spring Security `@PreAuthorize`.
- API response wrapper, pagination helper, centralized exception handling.
- Mail template, upload image, payment adapter.
- Approval workflow, soft delete/restore, scheduled jobs.
- Tu duy Booking capacity -> Inventory reservation.

Khong nen giu nguyen:

- Entity/logic `Tour`, `Destination`, `Schedule`, `Traveler`, `Booking` vi phu thuoc domain du lich.
- Service qua dai, nhieu logic trong mot class.
- Payment callback thieu idempotency/verification chat che.
- Capacity update chua co locking/optimistic version.
- Secrets hard-code trong config.

Uoc tinh tai su dung:

| Nhom | Ty le |
| --- | ---: |
| Reuse truc tiep | 25% |
| Reuse sau refactor | 35% |
| Chi reuse concept/pattern | 25% |
| Viet moi | 15% |

## 2. Technology Stack

### Frontend

| Thanh phan | Cong nghe | Version | File phat hien | Vai tro |
| --- | --- | --- | --- | --- |
| Framework | React | `^19.1.0` | `fe/package.json` | SPA UI |
| Language | TypeScript | `~5.8.3` | `fe/package.json`, `fe/tsconfig.json` | Typed frontend |
| Build tool | Vite | `^7.0.4` | `fe/package.json`, `fe/vite.config.ts` | Build/dev server |
| Routing | React Router DOM | `^7.9.4` | `fe/src/App.tsx` | Client-side routing |
| State management | Redux Toolkit + React Redux | `^2.9.2`, `^9.2.0` | `fe/src/store/index.ts`, `fe/src/store/slices/authSlice.ts` | Auth/global state |
| API fetching | Axios | `^1.11.0` | `fe/src/utils/authorizedAxios.ts`, `fe/src/utils/publicAxios.ts` | HTTP client |
| Server state | Khong phat hien | | | Khong thay React Query/SWR |
| Form management | React Hook Form | `^7.65.0` | `fe/src/pages/auth/Register/hooks/useRegisterForm.ts`, `fe/src/pages/private/ProfilePage.tsx` | Form |
| Validation | Zod | `^4.1.12` | `fe/src/schemas/bookingSchema.ts`, `fe/src/schemas/loginSchema.ts` | Client validation |
| Resolver | `@hookform/resolvers` | `^5.2.2` | `fe/package.json` | RHF + Zod |
| UI library | Radix UI + shadcn-style components | versions in `fe/package.json` | `fe/components.json`, `fe/src/components/ui/*` | UI primitives |
| Icons | lucide-react | `^0.546.0` | `fe/package.json`, many components | Icons |
| CSS framework | Tailwind CSS v4 | `^4.1.14` | `fe/src/index.css`, `fe/vite.config.ts` | Styling |
| Animation | framer-motion, tw-animate-css | `^12.23.24`, `^1.4.0` | `fe/package.json` | UI animation |
| Toast | react-toastify | `^11.0.5` | `fe/src/App.tsx` | Notification |
| Auth handling | Cookie auth + Redux flag | | `fe/src/utils/authorizedAxios.ts`, `fe/src/store/slices/authSlice.ts` | Session handling |
| Authorization handling | Route guard by role | | `fe/src/routes/ProtectedRoute.tsx`, `fe/src/App.tsx` | Admin/employee/user routes |
| i18n | Khong phat hien | | | Khong thay i18n lib |
| Image handling | Assets + Cloudinary upload client | | `fe/src/services/uploadServices.ts`, `fe/src/assets/*` | Upload/display image |
| File upload | FormData to Cloudinary | | `fe/src/services/uploadServices.ts` | Review image upload |
| Error handling | Axios interceptor + `getErrorMessage` | | `fe/src/utils/authorizedAxios.ts`, `fe/src/utils/getErrorMessage.ts` | API error handling |
| SEO | Khong phat hien | | | Khong thay SSR/meta manager |
| SSR/SSG | Khong phat hien | | | SPA CSR |
| Testing | Khong phat hien | | | Khong thay Vitest/Jest/RTL |
| Lint | ESLint | `^9.30.1` | `fe/eslint.config.js` | Lint |
| Package manager | npm | | `fe/package-lock.json` | Dependency management |

### Backend

| Thanh phan | Cong nghe | Version | File phat hien | Vai tro |
| --- | --- | --- | --- | --- |
| Framework | Spring Boot | `3.5.4` | `be/build.gradle` | REST API |
| Runtime | Java | `17` | `be/build.gradle` | Backend runtime |
| Build tool | Gradle | wrapper | `be/gradlew`, `be/build.gradle` | Build |
| Web | Spring Web | starter | `be/build.gradle` | Controller REST |
| ORM/Data | Spring Data MongoDB | starter | `be/build.gradle`, `be/src/main/java/www/repository/*` | Repository/document DB |
| Database | MongoDB Atlas URI | | `be/src/main/resources/application.properties` | Main database |
| Cache/session | Redis | starter + Redis Docker | `RedisConfig.java`, `docker-compose.yml` | OTP/session/token blacklist |
| Queue | Khong phat hien | | | Khong thay Rabbit/Kafka/Bull |
| Storage | Cloudinary | `1.36.0` | `CloudinaryConfig.java`, `CloudinaryServiceImpl.java` | Image upload/delete |
| Authentication | Spring Security + JWT | jjwt `0.11.5` | `SecurityConfig.java`, `JwtTokenProvider.java` | Cookie JWT auth |
| Authorization | `@PreAuthorize`, roles enum | | `SecurityConfig.java`, controllers, `UserRole.java` | RBAC |
| Validation | Jakarta Validation | starter | DTO request classes | Request validation |
| Logging | SLF4J/Lombok `@Slf4j` | | Service/controller classes | Application logging |
| Error handling | `@RestControllerAdvice` | | `GlobalExceptionHandler.java` | Centralized errors |
| Scheduler/Cron | Spring Scheduling | | `SchedulingConfig.java`, `@Scheduled` in services | Auto status sync/jobs |
| Mail | Spring Mail + Thymeleaf | starter | `MailServiceImpl.java`, `templates/email/*` | HTML mail |
| Payment | SePay custom integration | | `SePayServiceImpl.java`, `PaymentServiceImpl.java` | Checkout/payment callback |
| Search/AI | Spring AI + VectorStore | `1.0.0-M3` | `TourVectorStoreServiceImpl.java`, `ChatRouterServiceImpl.java` | Chatbot semantic search |
| WebSocket | Khong phat hien | | | Khong thay WS |
| API docs | Khong phat hien | | | Khong thay Swagger/OpenAPI |
| Testing | Spring Boot Test | starter | `be/src/test/java/www/BeApplicationTests.java` | Context test only |

## 3. Current Architecture

Architecture hien tai la Layered MVC, pha voi technical-folder modularization.

Request flow:

```text
React SPA
-> Axios service
-> Spring Controller
-> JwtAuthenticationFilter / @PreAuthorize
-> Service interface
-> Service implementation
-> MongoRepository
-> MongoDB
```

Folder backend:

```text
be/src/main/java/www/
  config/
  controller/
  exception/
  model/
    dto/
    embedded/
    entity/
    enums/
  repository/
  security/
  service/
    interfaces/
    implement/
  util/
    mapper/
    validation/
```

Folder frontend:

```text
fe/src/
  components/
  hooks/
  layouts/
  pages/
  providers/
  routes/
  schemas/
  services/
  store/
  types/
  utils/
```

Nhan xet:

- Tot: co phan tang controller/service/repository ro rang; DTO request/response; mapper; centralized exception; route guard frontend.
- Chua tot: module khong gom theo domain/feature nen khi domain lon, service bi phinh.
- Coupling cao: `BookingServiceImpl` goi `ScheduleService`, `TourService`, `PaymentService`; `PaymentServiceImpl` goi lai `BookingService`, repository booking/change request/schedule/tour.
- Business logic nam chu yeu trong service implementation.
- Co vi pham separation of concerns: controller co logic filter response, service co enrich DTO bang nhieu lookup, payment service xu ly ca booking/change request/mail.

## 4. Current Modules

| Module cu | File bang chung | Chuc nang hien tai | Tai su dung? | Module moi | Cach chuyen doi |
| --- | --- | --- | --- | --- | --- |
| Auth | `AuthController.java`, `AuthServiceImpl.java` | Register, login, OTP, Google auth, refresh, logout | Cao | Auth | Giu core, siet role/cookie/security |
| User/Admin | `User.java`, `UserServiceImpl.java`, `AdminController.java` | Profile, active user, promote role | Cao | Customer/User/Admin | Them address, customer profile |
| Destination | `Destination.java`, `DestinationServiceImpl.java` | Diem den, image, approve, soft delete | Mot phan | Category/Collection | Reuse approval/upload/soft-delete idea |
| Tour | `Tour.java`, `TourServiceImpl.java` | Tour catalog, itinerary, public/approval status | Concept | Product | Rewrite entity, reuse CRUD/approval |
| Schedule | `Schedule.java`, `ScheduleServiceImpl.java` | Lich khoi hanh, capacity, auto status | Concept | Inventory | Chuyen capacity sang stock reservation |
| Booking | `Booking.java`, `BookingServiceImpl.java` | Tao booking, status, cancel, stats | Mot phan | Order/Checkout | Giu state machine/pattern, rewrite code |
| Payment | `Payment.java`, `PaymentServiceImpl.java`, `SePayServiceImpl.java` | Tao payment, SePay checkout/callback | Cao | Payment | Doi `bookingId` -> `orderId`, them idempotency |
| Refund | `RefundRequest.java`, `RefundServiceImpl.java` | Yeu cau refund, employee confirm, admin approve | Mot phan | Return/RMA/Refund | Doi policy theo giao hang/tinh trang san pham |
| ChangeRequest | `BookingChangeRequest.java`, `BookingChangeRequestServiceImpl.java` | Doi booking, them/bot nguoi, thanh toan bu | Concept | Exchange/Order adjustment | Tach use case nho |
| Review | `Review.java`, `ReviewServiceImpl.java` | Review sau tour completed, reply, vote | Cao | Product Review | Doi `tourId` -> `productId/orderItemId` |
| Chatbot | `ChatRouterServiceImpl.java`, `TourVectorStoreServiceImpl.java` | AI route, semantic search tour, memory, OpenAI/Spring AI integration | Concept | OpenAI-powered shopping assistant | Reuse routing/memory/context idea, viet prompt shoe e-commerce moi |
| Upload | `CloudinaryServiceImpl.java` | Upload/delete image Cloudinary | Cao | Storage | Doi folder/path, validate MIME/size |
| Mail | `MailServiceImpl.java`, `templates/email/*` | OTP, booking, refund mail | Cao | Notification/Mail | Doi template order/shipping/return |

## 5. Reusable Infrastructure

| Infrastructure | Reuse % | Ly do | Can sua |
| --- | ---: | --- | --- |
| JWT cookie auth | 75% | Domain independent | Secure cookie, SameSite dung moi truong, CSRF |
| Refresh session Redis | 80% | Co sessionId, TTL | Them refresh token rotation/device management |
| Token blacklist Redis | 70% | Co TTL theo token expiry | Dung hash SHA-256 thay `hashCode`, fail-closed tuy endpoint |
| OTP Redis | 70% | Generic email verification/reset password | Khong dung `keys()` de reverse lookup OTP |
| RBAC | 70% | `@PreAuthorize` dung duoc | Mo rong role/permission |
| ApiResponse | 85% | Generic wrapper | Chuan hoa status/success field |
| PageUtils/PageResponse | 85% | Generic pagination | Dung nhat quan tren FE/BE |
| GlobalExceptionHandler | 80% | Centralized error | Bo catch RuntimeException qua rong |
| Cloudinary | 75% | Upload/delete generic | Security validation, product/review folders |
| Mail + Thymeleaf | 80% | Template infra generic | Config base URL/env |
| Payment adapter | 65% | SePay HMAC/checkout pattern | Verify callback, idempotency, order relation |
| Scheduler | 65% | Auto status job pattern | Tach job service, lock job neu scale |
| Docker Redis | 70% | Redis compose co san | Them app/db/env va healthcheck |

## 6. Reusable Business Techniques

### Authentication

Hien dang co:

- Access token JWT trong HttpOnly cookie: `AuthServiceImpl.java`.
- Refresh token JWT co `sessionId`: `JwtTokenProvider.java`.
- Session luu Redis: `SessionServiceImpl.java`.
- Logout blacklist access token: `TokenBlacklistServiceImpl.java`.
- OTP email verification/reset password: `OtpServiceImpl.java`, `MailServiceImpl.java`.
- Google OAuth: `AuthServiceImpl.java`, `useGoogleAuth.ts`.

Ap dung sang Shoe E-commerce:

- Giu customer login/register/forgot password.
- Them refresh token rotation khi refresh.
- Them session/device list cho customer.
- Them rate limit login/OTP.
- Bat `cookie.secure=true` production, cau hinh CORS theo domain shop.

### Authorization

Hien co roles:

```java
ADMIN, USER, EMPLOYEE
```

Mapping moi:

| Role cu | Role moi |
| --- | --- |
| USER | CUSTOMER |
| EMPLOYEE | STAFF |
| ADMIN | ADMIN |
| Them moi | SHOP_MANAGER, SUPER_ADMIN |

Quyen goi y:

- CUSTOMER: cart, checkout, order history, review, wishlist, return request.
- STAFF: manage product draft, process return, support order.
- SHOP_MANAGER: approve product, manage inventory, process order.
- ADMIN: user/admin operations, reports.
- SUPER_ADMIN: system settings, permission management.

### Booking/Transaction Flow

Hien tai:

```text
createBooking
-> validate user
-> validate schedule
-> validate capacity
-> calculate price by traveler age
-> create Booking PENDING
-> create SePay payment
-> payment success callback
-> Booking CONFIRMED
-> update schedule currentBookings
```

Van de:

- PENDING booking khong hold slot.
- Payment success moi tang capacity, co nguy co oversell neu nhieu nguoi thanh toan dong thoi.
- Chua thay optimistic lock/pessimistic lock/idempotency chac chan.

Flow e-commerce nen lam:

```text
Checkout
-> validate cart item
-> validate variant active
-> atomic reserve stock
-> create order PENDING_PAYMENT
-> create payment
-> webhook success
-> idempotency check
-> confirm order
-> deduct stock or convert reserved -> sold
-> notification
```

### OpenAI-powered Shopping Assistant

Hien tai project cu co `ChatRouterServiceImpl.java`, `ConversationMemoryServiceImpl.java`, `TourVectorStoreServiceImpl.java` va cau hinh OpenAI/Spring AI trong `application.properties`.

Ap dung sang Shoe E-commerce:

- Dung OpenAI API lam provider chinh, goi tu backend, khong goi truc tiep tu frontend.
- Giu y tuong intent routing, conversation memory, context builder.
- Viet lai prompt theo shoe e-commerce, khong reuse prompt travel.
- Backend giu `OPENAI_API_KEY` trong env/secret manager.
- AI chi tu van san pham/size/order/policy, khong tu y mutate order/payment/refund.

Module moi nen tach:

```text
modules/ai/
  AiChatController
  AiChatService
  AiRouterService
  ProductContextService

infrastructure/ai/
  OpenAiClientConfig
  OpenAiChatAdapter
  OpenAiEmbeddingAdapter optional
```

## 7. Booking -> E-commerce Mapping

| Booking Tour | Shoe E-commerce | Giu tu duy | Can thay doi |
| --- | --- | --- | --- |
| Tour availability | Product variant inventory | Check kha dung truoc checkout | Can SKU/size/color/warehouse |
| Schedule capacity | Inventory stock | Capacity counter | Can atomic update/version |
| Booking PENDING | Order PENDING_PAYMENT | Trang thai cho thanh toan | PENDING phai co reservation expiry |
| Booking CONFIRMED | Order PAID/CONFIRMED | Payment success doi status | Webhook idempotent |
| Booking COMPLETED | Order DELIVERED/COMPLETED | Job auto complete | Dua tren shipping delivery |
| Booking cancel | Order cancel | Release resource | Release stock reservation |
| Refund request | Return/RMA | Workflow duyet | Theo ngay giao hang/tinh trang san pham |
| Change request | Exchange/order adjustment | Gia chenh lech | Tach exchange/return/payment adjustment |
| Traveler age pricing | Variant/promotion pricing | Price calculation service | Doi rule theo SKU/voucher |
| Tour review after completed | Product review after delivered | Verified review | Link order item |

## 8. Database Migration

### Co the giu

```text
users
payments concept
reviews concept
Redis sessions
Redis OTP
email templates structure
soft delete fields
created_at / updated_at fields
```

### Co the refactor

```text
reviews -> product_reviews
image_urls -> product_images/review_images
approval_status/public_status -> product moderation fields
refund_requests -> return_requests/refund_requests
chat_conversations -> shopping_assistant_conversations
```

### Phai thay

```text
tours
destinations
schedules
bookings
travelers
booking_change_requests
tour_itinerary
```

### Schema moi de xuat

```text
users
roles
permissions

products
product_variants
categories
brands
product_images

warehouses
inventory
stock_reservations

carts
cart_items

orders
order_items
payments
payment_events

addresses
reviews
review_replies
wishlists
notifications
return_requests
refund_requests
audit_logs
```

Product variant cho giay:

```text
Product: Nike Air Force 1

variants:
- sku: NAF1-WHT-40, color: White, size: 40, price: 2500000, stock: 12
- sku: NAF1-WHT-41, color: White, size: 41, price: 2500000, stock: 8
- sku: NAF1-BLK-40, color: Black, size: 40, price: 2550000, stock: 5
- sku: NAF1-BLK-41, color: Black, size: 41, price: 2550000, stock: 9
```

Inventory nen co:

```text
inventory:
  variant_id
  warehouse_id
  on_hand
  reserved
  sold
  available
  version
```

`version` dung cho optimistic locking de tranh oversell.

## 9. Design Patterns

| Pattern | File bang chung | Cach trien khai | Nen giu? | Ap dung e-commerce |
| --- | --- | --- | --- | --- |
| MVC | `controller/*`, `service/*`, `repository/*` | Controller REST goi service | Co | Product/Order/Cart controllers |
| Service Pattern | `BookingServiceImpl.java`, `TourServiceImpl.java` | Business logic trong service | Co, nhung tach nho | CheckoutService, InventoryReservationService |
| Repository Pattern | `BookingRepository.java`, `TourRepository.java` | Extends `MongoRepository` | Co | ProductRepository, OrderRepository |
| DTO Pattern | `model/dto/request`, `model/dto/response` | Request/response tach entity | Co | ProductRequest, OrderResponse |
| Mapper | `BookingMapper.java`, `ScheduleMapper.java` | Entity <-> DTO | Co | ProductMapper, OrderMapper |
| Adapter | `SePayServiceImpl.java`, `CloudinaryServiceImpl.java` | Boc ngoai payment/storage | Co | PaymentGatewayAdapter, StorageAdapter |
| Dependency Injection | Lombok `@RequiredArgsConstructor`, Spring `@Service` | Constructor injection | Co | Tat ca module |
| State Machine basic | `StatusBooking.java`, `validateStatusTransition` | Enum status + transition validation | Co | OrderStatus transition |
| Scheduled Job | `@Scheduled` in `ScheduleServiceImpl`, `BookingServiceImpl` | Auto sync/complete | Co | Payment timeout, release reservation |
| Facade-like service | `PaymentServiceImpl` | Gom payment + booking + mail | Can refactor | Tach PaymentUseCase/OrderPaymentHandler |
| Event-driven | Khong phat hien ro | | Nen bo sung | Outbox/event for order paid |
| CQRS | Khong phat hien | | Chua can MVP | Read model cho admin dashboard sau |
| Unit of Work | Khong phat hien | | Can thiet cho inventory/order | Transaction boundary ro |

## 10. Advanced Techniques

### Database

Ky thuat: Transaction  
Hien dang dung o: `@Transactional` trong service.  
Giai quyet: Gom nhieu thao tac DB.  
Danh gia: Can than trong MongoDB vi khong thay `MongoTransactionManager`.  
Ap dung: Checkout/order/payment phai co transaction thuc hoac atomic update.

Ky thuat: Unique constraint  
Hien dang dung o: `User.email` co `@Indexed(unique = true)`.  
Ap dung: `users.email`, `product_variants.sku`, `payments.orderInvoiceNumber`, `payment_events.transactionId`.

Ky thuat: Soft delete  
Hien dang dung o: `Booking`, `Tour`, `Destination`, `Schedule`.  
Ap dung: Products/categories/orders admin trash. Khong hard delete product da co order.

Ky thuat: Pagination  
Hien dang dung o: `PageUtils`, repository page methods.  
Ap dung: Product listing, order listing, admin tables.

Ky thuat: N+1 risk  
Hien dang co o: `BookingServiceImpl.enrichBookingWithTourInfo`, `ReviewServiceImpl.getUserName`.  
Ap dung moi: Dung batch query/aggregation/snapshot fields trong order item.

### Performance

Ky thuat: Redis cache/session  
Hien dang dung o: OTP/session/blacklist.  
Ap dung: Cart cache, product detail cache, rate limit, reservation TTL.

Ky thuat: Debounce  
Hien dang dung o: `fe/src/hooks/useDebounce.ts`.  
Ap dung: Product search/filter.

Ky thuat: Image upload  
Hien dang dung Cloudinary.  
Ap dung: Product images, variant images, review images.

### Concurrency

Ky thuat: Capacity check  
Hien dang dung o: `ScheduleServiceImpl.hasAvailableCapacity`.  
Van de: Check-then-update co race condition.  
Ap dung: Inventory atomic update:

```text
update inventory
where variantId = ?
and available >= requestedQty
inc reserved +requestedQty
inc available -requestedQty
```

Ky thuat: Idempotency  
Hien khong phat hien thuc su.  
Ap dung: Bat buoc cho payment webhook va checkout retry.

### Security

Ky thuat: Password hashing  
Hien dang dung `BCryptPasswordEncoder` trong `SecurityConfig.java`.  
Ap dung: Giu.

Ky thuat: JWT cookie  
Hien dang dung `access_token`, `refresh_token` HttpOnly.  
Ap dung: Giu nhung bat Secure/CSRF production.

Ky thuat: CSRF  
Hien dang disable trong `SecurityConfig.java`.  
Ap dung: Neu dung cookie auth, e-commerce nen co CSRF token cho state-changing requests.

Ky thuat: CORS  
Hien hard-code localhost trong `SecurityConfig.java`, `CorsConfig.java`.  
Ap dung: Env-based allowlist.

Ky thuat: File upload security  
Hien co upload base64, chua thay validate MIME/size server-side day du.  
Ap dung: validate content type, max size, dimensions, folder isolation.

### Reliability

Ky thuat: Retry  
Khong phat hien framework retry.  
Ap dung: Payment/shipping provider call co retry + idempotency.

Ky thuat: Dead letter queue  
Khong phat hien.  
Ap dung Phase 2 neu dung queue.

Ky thuat: Error recovery  
Hien co sync current bookings job.  
Ap dung: sync inventory reservation, expire payment, reconcile payment event.

## 11. Booking Deep Dive

Flow hien tai:

```text
User chon tour
-> chon schedule
-> dien contact/travelers
-> FE validate bang Zod
-> BE validate BookingValidator
-> check schedule capacity
-> calculate total by traveler age
-> create Booking PENDING
-> create SePay payment
-> SePay callback success
-> update Payment COMPLETED
-> update Booking CONFIRMED
-> update Schedule.currentBookings
-> send booking confirmation mail
```

Tu duy giu lai:

- Trang thai rieng cho booking/order.
- Validate owner khi get/update/cancel.
- Payment record tach voi booking.
- Confirmation mail sau payment success.
- Scheduled job cho auto status.
- Admin statistics by status/date.

Can thay doi:

- Khong de order PENDING ma khong reserve stock.
- Payment success phai idempotent.
- Inventory update phai atomic.
- Price calculation phai tach service rieng.
- Order item phai snapshot product name, SKU, size, color, price.

Can bo sung:

- Cart.
- Stock reservation TTL.
- Payment timeout job.
- Shipping address/shipping fee.
- Voucher/promotion.
- Return/RMA.
- Inventory ledger/audit.

## 12. New Architecture

De xuat backend:

```text
be/src/main/java/www/
  common/
    exception/
    pagination/
    response/
    validation/
  config/
  security/
  infrastructure/
    redis/
    mail/
    storage/
    payment/
    ai/
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
```

De xuat frontend:

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
    reviews/
    wishlist/
    admin/
```

Why:

- Giam service qua dai.
- Moi module co controller/service/repository/dto rieng.
- Infrastructure nhu payment/storage/mail khong phu thuoc domain.
- Dung use case nho cho checkout/payment/order transition.

## 13. E-commerce Flow

### Add to cart

```text
Customer
-> Product detail
-> Select variant: size/color
-> Validate variant active
-> Add/merge cart item
```

### Checkout

```text
Cart
-> Validate cart items
-> Validate product/variant status
-> Validate stock
-> Calculate subtotal
-> Apply voucher/promotion
-> Calculate shipping
-> Reserve stock
-> Create order PENDING_PAYMENT
-> Create payment
```

### Payment success

```text
Payment webhook
-> Verify signature
-> Check idempotency by transactionId/orderInvoiceNumber
-> Update payment COMPLETED
-> Update order PAID/CONFIRMED
-> Confirm reservation / deduct stock
-> Send order confirmation
-> Create notification
```

### Payment failed/timeout

```text
Payment failed/expired
-> Update payment FAILED/EXPIRED
-> Update order PAYMENT_FAILED/CANCELLED
-> Release stock reservation
-> Notify customer
```

### Cancel order

```text
Customer/Admin
-> Check order status
-> If not shipped: cancel
-> Release reservation or restore stock
-> Cancel/refund payment if needed
```

### Return/RMA

```text
Customer
-> Select delivered order item
-> Submit reason/images
-> Staff inspect
-> Manager/Admin approve/reject
-> Refund/exchange
```

## 14. New Modules

### MVP

- Auth
- User/Customer
- Product
- Category
- Brand
- Product Variant
- Product Image
- Inventory
- Cart
- Checkout
- Order
- Payment
- Address
- Review
- Wishlist
- Admin

### Phase 2

- Voucher
- Promotion
- Notification center
- Advanced search/filter
- Recommendation
- Recently viewed
- Flash sale
- Shipping provider
- Return/RMA

### Advanced

- Redis cache for product/search/cart.
- Queue/background jobs.
- Search engine.
- Recommendation system.
- Analytics.
- Event-driven outbox.
- Payment reconciliation.

## 15. Migration Plan

### Phase 1 - Extract reusable core

Tach:

```text
auth
users
rbac
api response
pagination
exceptions
redis
otp
mail
storage
payment adapter skeleton
docker redis
```

### Phase 2 - Remove travel domain

Loai bo:

```text
tour
destination
schedule
traveler
booking-specific forms
booking_change_request travel rules
weather travel context
tour chatbot prompt/data
```

### Phase 3 - Build catalog

Tao:

```text
product
category
brand
product_variant
product_image
product approval/public status
```

### Phase 4 - Build inventory and checkout

Chuyen:

```text
Schedule capacity -> Inventory
Booking validation -> Checkout validation
Booking status -> Order status
Booking price -> Order pricing
```

Bat buoc co:

- Atomic stock reservation.
- Reservation expiry.
- Idempotency key.
- Payment webhook verification.

### Phase 5 - Build e-commerce features

Them:

```text
cart
wishlist
review
address
shipping
promotion
return/refund
admin dashboard
```

### Phase 6 - Hardening

- Add indexes.
- Add tests.
- Remove debug logs.
- Move secrets to env.
- Add API docs.
- Add monitoring/log correlation.

## 16. Reuse Matrix

| Thanh phan | Reuse | Refactor | Rewrite | Ghi chu |
| --- | ---: | ---: | ---: | --- |
| Authentication | 65% | 30% | 5% | Core tot, can secure production |
| Authorization | 50% | 40% | 10% | Role enum don gian |
| User | 70% | 25% | 5% | Them customer/address |
| Database infrastructure | 60% | 30% | 10% | Can index/transaction strategy |
| Redis | 75% | 20% | 5% | Tranh `keys()` |
| Storage | 60% | 30% | 10% | Doi folder/validate |
| Booking | 10% | 35% | 55% | Chi reuse order concept |
| Payment | 55% | 35% | 10% | Doi booking -> order |
| Review | 50% | 40% | 10% | Link product/order item |
| Notification/Mail | 70% | 25% | 5% | Doi template |
| Docker | 50% | 40% | 10% | Redis co san, can them service |
| CI/CD | 0% | 0% | 100% | Khong phat hien |

## 17. Top 10 Techniques Nen Giu

1. JWT + HttpOnly cookie auth.
2. Refresh session bang Redis.
3. OTP email verification/reset password.
4. RBAC bang `@PreAuthorize`.
5. Repository + Service + DTO + Mapper layering.
6. Centralized exception handler + API response wrapper.
7. Pagination helper cho list/admin table.
8. Approval workflow staff/admin.
9. Soft delete + restore/trash.
10. Payment adapter + scheduled jobs, nhung phai bo sung idempotency/locking.

## 18. Problems Khong Nen Mang Sang Project Moi

| Van de | File | Muc do | Tai sao | Cach lam tot hon |
| --- | --- | --- | --- | --- |
| Secrets hard-code | `be/src/main/resources/application.properties` | Critical | Lo Mongo/Gmail/Cloudinary/OpenAI/SePay key | Dung `.env`, secret manager, rotate key |
| CSRF disabled voi cookie auth | `SecurityConfig.java` | High | Cookie auth de bi CSRF neu production | Bat CSRF token cho state-changing request |
| CORS hard-code localhost | `SecurityConfig.java`, `CorsConfig.java` | Medium | Kho deploy, de cau hinh sai | Env-based allowlist |
| Payment callback thieu idempotency | `PaymentController.java`, `PaymentServiceImpl.java` | High | Webhook retry co the double update | `payment_events` unique transaction |
| Capacity check-then-update | `BookingServiceImpl.java`, `ScheduleServiceImpl.java` | High | Race condition/oversell | Atomic inventory reservation |
| Service qua dai | `BookingChangeRequestServiceImpl.java`, `BookingServiceImpl.java` | High | Kho test/maintain | Tach use case/service nho |
| N+1 query | `BookingServiceImpl.java`, `ReviewServiceImpl.java` | Medium | Cham khi list lon | Batch query, aggregation, snapshot |
| Redis `keys()` | `OtpServiceImpl.java`, `SessionServiceImpl.java` | Medium | Cham/block Redis production | SCAN/reverse index |
| Debug log FE | nhieu file `fe/src/pages/*`, `uploadServices.ts` | Low/Medium | Lo thong tin, noise | Logger theo env |
| Hard-coded frontend/payment URL | `PaymentServiceImpl.java`, email templates | Medium | Sai khi deploy | Config base URL |
| Manual test endpoint TODO | `BookingController.java` | Medium | Nguy co production | Feature flag/admin job runner |

## 19. Next Implementation Steps

1. Tao branch/project moi cho Shoe E-commerce.
2. Copy/refactor core backend: config, security, exception, response, pagination, redis, mail, storage.
3. Doi roles sang `CUSTOMER`, `STAFF`, `SHOP_MANAGER`, `ADMIN`, `SUPER_ADMIN`.
4. Xay module catalog: product, brand, category, variant, image.
5. Xay module inventory voi atomic reservation.
6. Xay cart/checkout/order.
7. Refactor payment adapter sang `orderId`, them idempotency webhook.
8. Port review sang product review, bat buoc verified purchase.
9. Port refund workflow thanh return/RMA.
10. Viet test cho checkout, inventory reservation, payment webhook, auth refresh.
