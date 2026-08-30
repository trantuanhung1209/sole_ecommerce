# Request Cycle trong Spring Boot — SOLE E-commerce

> Sơ đồ luồng hình chữ **U**: Request đi **xuống** qua các lớp → Database → Response đi **lên** về Client.  
> Mỗi bước có **ví dụ file thật** trong dự án này.

**Ví dụ minh họa xuyên suốt:**

```http
GET /api/products?search=nike&page=0&pageSize=20
```

(Ví dụ có auth: `GET /api/orders/my-orders` — ghi chú ở bước 4)

---

## Sơ đồ tổng quan

```text
                    ┌─────────────┐
                    │   CLIENT    │  ① Request xuống
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   TOMCAT    │  ②
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │FILTER CHAIN │  ③
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SECURITY  │  ④
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ DISPATCHER  │  ⑤
                    │  SERVLET    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  HANDLER    │  ⑥
                    │  MAPPING    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ CONTROLLER  │  ⑦ Entry
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SERVICE   │  ⑧ Entry
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ REPOSITORY  │  ⑨
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  DATABASE   │  ⑩ MongoDB / Redis
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SERVICE   │  ⑪ Exit — Entity → DTO
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ CONTROLLER  │  ⑫ Exit — ApiResponse
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   JACKSON   │  ⑬ Object → JSON
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   TOMCAT    │  ⑭ HTTP Response
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   CLIENT    │  ⑮ Nhận JSON
                    └─────────────┘
```

---

## Chi tiết từng bước + file dự án

### ① CLIENT — Gửi HTTP Request

**Việc gì xảy ra:** Browser/App gửi URL, headers, cookies.

**File FE (ví dụ catalog):**

| File | Vai trò |
|------|---------|
| [`fe/src/pages/ecommerce/ProductListPage.tsx`](../fe/src/pages/ecommerce/ProductListPage.tsx) | UI gọi hook/API |
| [`fe/src/hooks/useProductSearch.ts`](../fe/src/hooks/useProductSearch.ts) | TanStack Query fetch products |
| [`fe/src/services/ecommerceServices.ts`](../fe/src/services/ecommerceServices.ts) | `catalogApi.getProducts(...)` |
| [`fe/src/utils/publicAxios.ts`](../fe/src/utils/publicAxios.ts) | Axios instance — `baseURL: .../api`, `withCredentials: true` |

**Request thực tế:**

```http
GET http://localhost:3001/api/products?search=nike&page=0&pageSize=20
Cookie: XSRF-TOKEN=...        (nếu có)
Accept: application/json
```

Route **cần đăng nhập** dùng [`fe/src/utils/authorizedAxios.ts`](../fe/src/utils/authorizedAxios.ts) — tự gửi thêm cookie `access_token`.

---

### ② TOMCAT — Embedded Web Server

**Việc gì xảy ra:** Tomcat (embedded trong Spring Boot) nhận socket, tạo `HttpServletRequest` / `HttpServletResponse`.

**File / config:**

| File | Vai trò |
|------|---------|
| [`be/src/main/java/www/Server.java`](../be/src/main/java/www/Server.java) | `@SpringBootApplication` — khởi động embedded Tomcat |
| [`be/src/main/resources/application.properties`](../be/src/main/resources/application.properties) | `server.port=3001`, `server.servlet.context-path=/api` |

**Lưu ý:** Context path `/api` → URI servlet nhận là `/products`, không phải `/api/products`.

---

### ③ FILTER CHAIN — Lọc trước Controller

**Việc gì xảy ra:** Request đi qua chuỗi `Filter` (CORS, log, rate limit...) **trước** Spring Security và Controller.

**File dự án (theo thứ tự chạy):**

| # | File | Chức năng |
|---|------|-----------|
| 1 | [`CorrelationIdFilter.java`](../be/src/main/java/www/config/CorrelationIdFilter.java) | Gắn `X-Correlation-Id` + MDC log |
| 2 | [`RequestLoggingFilter.java`](../be/src/main/java/www/config/RequestLoggingFilter.java) | Log `GET /api/products → 200 (45ms)` |
| 3 | [`CoopHeaderFilter.java`](../be/src/main/java/www/config/CoopHeaderFilter.java) | Header COOP cho Google OAuth |
| 4 | [`CorsConfig.java`](../be/src/main/java/www/config/CorsConfig.java) | Cho phép origin FE (localhost:5173...) |

**Ví dụ log sau filter:**

```text
GET    /api/products?search=nike                     -> 200 (45ms) [127.0.0.1]
```

---

### ④ SPRING SECURITY — JWT + phân quyền

**Việc gì xảy ra:** Đọc cookie JWT → validate → gắn user vào `SecurityContext`. Route không đủ quyền → 401/403.

**File dự án:**

| File | Chức năng |
|------|-----------|
| [`SecurityConfig.java`](../be/src/main/java/www/config/SecurityConfig.java) | Cấu hình STATELESS, CSRF, `authorizeHttpRequests` |
| [`RateLimitFilter.java`](../be/src/main/java/www/security/RateLimitFilter.java) | Rate limit login/checkout (Redis) |
| [`JwtAuthenticationFilter.java`](../be/src/main/java/www/security/JwtAuthenticationFilter.java) | Đọc cookie `access_token` → validate |
| [`SessionServiceImpl.java`](../be/src/main/java/www/service/implement/SessionServiceImpl.java) | So token với Redis session |
| [`CustomUserDetailsService.java`](../be/src/main/java/www/security/CustomUserDetailsService.java) | Load user + roles |
| [`JwtAuthenticationEntryPoint.java`](../be/src/main/java/www/security/JwtAuthenticationEntryPoint.java) | Trả **401** JSON |
| [`JwtAccessDeniedHandler.java`](../be/src/main/java/www/security/JwtAccessDeniedHandler.java) | Trả **403** JSON |
| [`SpaCsrfTokenRequestHandler.java`](../be/src/main/java/www/security/SpaCsrfTokenRequestHandler.java) | Đọc header `X-XSRF-TOKEN` |

**Với `GET /products`:**

```java
// SecurityConfig.java — permitAll
authz.requestMatchers(HttpMethod.GET, "/products/**", ...).permitAll();
```

→ Không cần cookie `access_token`. JwtFilter chạy nhưng request vẫn **anonymous**.

**Với `GET /orders/my-orders` (ví dụ auth):**

```java
authz.requestMatchers("/orders/**", ...).authenticated();
```

→ JwtFilter **bắt buộc** validate token + Redis. Thiếu token → `JwtAuthenticationEntryPoint` → 401.

```java
// JwtAuthenticationFilter.java (rút gọn)
if (jwt != null && sessionService.validateAccessToken(jwt)) {
    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

---

### ⑤ DISPATCHER SERVLET — Điều phối trung tâm

**Việc gì xảy ra:** `DispatcherServlet` (Spring MVC built-in) nhận request sau Security, chuẩn bị gọi Controller.

**File:** Không có class custom — Spring Boot auto-config (`spring-boot-starter-web`).

**Entry app:** [`Server.java`](../be/src/main/java/www/Server.java)

---

### ⑥ HANDLER MAPPING — Tìm Controller + method

**Việc gì xảy ra:** Spring quét annotation, map URL + HTTP method → method Java.

**Ví dụ mapping:**

```text
GET /products  →  CatalogController.products()
```

**File:**

| File | Annotation |
|------|------------|
| [`CatalogController.java`](../be/src/main/java/www/modules/catalog/controller/CatalogController.java) | `@GetMapping("/products")` dòng 30 |

```java
@GetMapping("/products")
public ResponseEntity<ApiResponse<PageResponse<ProductSummary>>> products(
        @RequestParam(required = false) String search, ...) {
```

**Ví dụ auth:**

```text
GET /orders/my-orders  →  EcommerceOrderController.mine()
```

File: [`EcommerceOrderController.java`](../be/src/main/java/www/modules/orders/controller/EcommerceOrderController.java) dòng 23.

---

### ⑦ CONTROLLER — Entry (HTTP layer)

**Việc gì xảy ra:** Parse `@RequestParam`, `@PathVariable`, `@RequestBody` → gọi Service.

**File ví dụ:**

```java
// CatalogController.java
return ResponseEntity.ok(ApiResponse.success(
    PageUtils.toPageResponse(
        catalogService.searchPublished(buildFilter(...), PageRequest.of(page, pageSize))
    )
));
```

| Thành phần | File |
|------------|------|
| Controller | [`CatalogController.java`](../be/src/main/java/www/modules/catalog/controller/CatalogController.java) |
| DTO filter | [`ProductFilter.java`](../be/src/main/java/www/modules/catalog/dto/ProductFilter.java) |
| DTO response | [`ProductDtos.ProductSummary`](../be/src/main/java/www/modules/catalog/dto/ProductDtos.java) |

**Controller không query DB trực tiếp** — chỉ gọi Service.

---

### ⑧ SERVICE — Entry (business logic)

**Việc gì xảy ra:** Validate nghiệp vụ, filter, sort, orchestrate nhiều repository.

**File ví dụ:**

```java
// CatalogService.java
public Page<ProductSummary> searchPublished(ProductFilter filter, Pageable pageable) {
    List<Product> products = loadPublishedCandidates(filter.getSearch());
    List<ProductSummary> summaries = products.stream()
            .filter(p -> matchesBasicFilter(p, filter))
            .map(this::toSummary)
            .filter(s -> matchesVariantFilter(s.getProductId(), filter))
            ...
}
```

| File | Vai trò |
|------|---------|
| [`CatalogService.java`](../be/src/main/java/www/modules/catalog/service/CatalogService.java) | Logic tìm kiếm + filter sản phẩm |
| [`ProductTextSearchService.java`](../be/src/main/java/www/modules/catalog/search/ProductTextSearchService.java) | MongoDB `$text` search |

**Ví dụ auth — OrderService:**

File: [`OrderService.java`](../be/src/main/java/www/modules/orders/service/OrderService.java) — `mine(userId, pageable)` chỉ trả đơn của user đó.

---

### ⑨ REPOSITORY — Truy vấn dữ liệu

**Việc gì xảy ra:** Spring Data MongoDB — CRUD, custom query.

**File ví dụ:**

| File | Vai trò |
|------|---------|
| [`ProductRepository.java`](../be/src/main/java/www/modules/catalog/repository/ProductRepository.java) | `findByStatusAndPublicStatusAndDeletedFalse(...)` |
| [`ProductVariantRepository.java`](../be/src/main/java/www/modules/catalog/repository/ProductVariantRepository.java) | Variants theo productId |
| [`OrderRepository.java`](../be/src/main/java/www/modules/orders/repository/OrderRepository.java) | Orders theo userId |

Interface extends `MongoRepository<Product, String>`.

---

### ⑩ DATABASE — Lưu trữ

**Việc gì xảy ra:** MongoDB (và Redis cho session/cache) thực thi query.

**Config:**

```properties
# application.properties
spring.data.mongodb.uri=mongodb://localhost:27017/sole_ecommerce
spring.data.redis.host=localhost
```

**Collection ví dụ:**

| Collection | Entity |
|------------|--------|
| `products` | [`Product.java`](../be/src/main/java/www/modules/catalog/model/Product.java) |
| `product_variants` | [`ProductVariant.java`](../be/src/main/java/www/modules/catalog/model/ProductVariant.java) |
| `orders` | [`Order.java`](../be/src/main/java/www/modules/orders/model/Order.java) |

**Redis** (không phải bước ⑨ repo, nhưng dùng ở Security): session keys `refresh:{userId}:{sessionId}` trong [`SessionServiceImpl.java`](../be/src/main/java/www/service/implement/SessionServiceImpl.java).

---

### ⑪ SERVICE — Exit (Entity → DTO)

**Việc gì xảy ra:** Map `Product` entity → `ProductSummary` DTO, tính minPrice, stock, v.v.

**File:**

```java
// CatalogService.java — toSummary()
private ProductSummary toSummary(Product product) { ... }
```

Service trả về **DTO**, không trả entity thô ra ngoài (tránh leak field nội bộ).

---

### ⑫ CONTROLLER — Exit (đóng gói response)

**Việc gì xảy ra:** Bọc kết quả trong envelope chuẩn `ApiResponse<T>`.

**File:**

| File | Vai trò |
|------|---------|
| [`ApiResponse.java`](../be/src/main/java/www/model/dto/response/ApiResponse.java) | `{ status, message, data }` |
| [`PageUtils.java`](../be/src/main/java/www/util/PageUtils.java) | Wrap pagination |

**JSON trả về:**

```json
{
  "status": 200,
  "data": {
    "content": [ { "productId": "...", "name": "Nike ...", "minPrice": 1500000 } ],
    "page": 0,
    "totalElements": 12
  }
}
```

**Nếu lỗi** (không qua bước ⑫ bình thường): [`GlobalExceptionHandler.java`](../be/src/main/java/www/config/GlobalExceptionHandler.java) bắt exception → `ApiResponse` + HTTP 4xx/5xx.

---

### ⑬ HTTP MESSAGE CONVERTER (Jackson) — Java → JSON

**Việc gì xảy ra:** Jackson serialize `ApiResponse` → chuỗi JSON UTF-8.

**Config:**

```properties
# application.properties
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.time-zone=UTC
```

Không có file custom — `MappingJackson2HttpMessageConverter` mặc định của Spring MVC.

---

### ⑭ TOMCAT — Gửi HTTP Response

**Việc gì xảy ra:** Set status `200`, header `Content-Type: application/json`, body JSON, header `X-Correlation-Id` (từ filter bước ③).

---

### ⑮ CLIENT — Nhận và xử lý JSON

**Việc gì xảy ra:** Axios nhận response → component render UI.

**File FE:**

```typescript
// useProductSearch.ts / ecommerceServices.ts
const res = await publicAxios.get("/products", { params: { search: "nike" } });
const page = res.data.data;  // ApiResponse wrapper → data
```

**Nếu 401** (route auth): [`authorizedAxios.ts`](../fe/src/utils/authorizedAxios.ts) interceptor → gọi `authServices.refreshToken()` → retry request.

---

## Bảng tóm tắt: Down vs Up

| Hướng | Luồng | File điển hình |
|-------|-------|----------------|
| **↓ Down** | Client → Tomcat → Filter → Security → Dispatcher → Controller → Service → Repository → DB | `publicAxios` → `CorrelationIdFilter` → `JwtAuthenticationFilter` → `CatalogController` → `CatalogService` → `ProductRepository` → MongoDB |
| **↑ Up** | DB → Repository → Service (DTO) → Controller (ApiResponse) → Jackson → Tomcat → Client | `Product` → `toSummary()` → `ApiResponse.success()` → JSON → React |

---

## Ghi chú quan trọng (áp dụng dự án này)

### Security chạy trước Controller

Mọi request đều qua [`SecurityConfig.java`](../be/src/main/java/www/config/SecurityConfig.java) + [`JwtAuthenticationFilter.java`](../be/src/main/java/www/security/JwtAuthenticationFilter.java) **trước** khi tới Controller.

### STATELESS + JWT + Redis session

```java
// SecurityConfig.java
.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
```

- **Không** dùng `HttpSession`
- Mỗi request auth mang cookie `access_token`
- Server validate JWT **và** check Redis ([`SessionServiceImpl`](be/src/main/java/www/service/implement/SessionServiceImpl.java)) → revoke/logout có hiệu lực ngay

### CSRF cho POST/PUT/DELETE

FE gửi header `X-XSRF-TOKEN` từ cookie — xem [`publicAxios.ts`](../fe/src/utils/publicAxios.ts), [`authorizedAxios.ts`](../fe/src/utils/authorizedAxios.ts).

### Guest vs Authenticated (pattern đặc biệt)

[`CartController.java`](../be/src/main/java/www/modules/cart/controller/CartController.java) — `/cart/**` là `permitAll` nhưng tự resolve user hoặc guest:

```java
if (authentication != null && principal instanceof UserPrincipal p)
    return new CartContext(p.getId(), null);
return new CartContext(null, guestCartSupport.ensureGuestSessionId(...));
```

File guest cookie: [`GuestCartSupport.java`](../be/src/main/java/www/modules/cart/support/GuestCartSupport.java)

### SSE — luồng khác JSON thông thường

`GET /api/notifications/stream` → [`NotificationController.java`](../be/src/main/java/www/modules/notifications/controller/NotificationController.java) → `SseEmitter` — không qua `ApiResponse` JSON.

---

## Ví dụ thứ hai: Request có authentication

```http
GET /api/orders/my-orders
Cookie: access_token=...; refresh_token=...; XSRF-TOKEN=...
```

| Bước | Khác biệt so với `/products` |
|------|-------------------------------|
| ① | [`authorizedAxios.ts`](../fe/src/utils/authorizedAxios.ts) thay vì publicAxios |
| ④ | `authenticated()` — bắt buộc token hợp lệ |
| ⑥ | [`EcommerceOrderController.mine()`](../be/src/main/java/www/modules/orders/controller/EcommerceOrderController.java) |
| ⑧ | [`OrderService.mine(userId, ...)`](../be/src/main/java/www/modules/orders/service/OrderService.java) |
| ⑨ | [`OrderRepository`](../be/src/main/java/www/modules/orders/repository/OrderRepository.java) filter `userId` |

---

## Liên quan

- Luồng nghiệp vụ (checkout, return, AI): [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md)
- API spec: [`SHOE_ECOMMERCE_SPECIFICATION.md`](./SHOE_ECOMMERCE_SPECIFICATION.md)
