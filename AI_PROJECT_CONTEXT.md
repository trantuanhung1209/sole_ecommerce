# AI Project Context - SOLE E-commerce

## Muc dich tai lieu

Tai lieu nay cung cap du lieu dau vao da duoc doi chieu voi repository de AI co the:

- tom tat du an;
- viet mo ta portfolio, CV hoac LinkedIn;
- chuan bi noi dung phong van;
- phan tich kien truc va cac dong gop ky thuat.

Chi su dung cac thong tin duoi day. Khong tu tao so lieu kinh doanh, so nguoi dung, doanh thu, hieu nang, quy mo team, thoi gian thuc hien hoac ty le cai thien neu khong co them bang chung.

## Tong quan

**Ten du an:** SOLE Shoe E-commerce

**Loai du an:** Nen tang thuong mai dien tu ban giay full-stack

**Kien truc chinh:** React SPA giao tiep voi REST API Spring Boot; MongoDB luu du lieu nghiep vu; Redis phuc vu cache va rate limiting; Docker Compose dong goi moi truong demo.

He thong bao phu luong mua sam cua khach hang, van hanh cua nhan vien va quan tri, gom danh muc san pham, gio hang, thanh toan, ton kho, don hang, khuyen mai, danh gia, wishlist, doi tra/hoan tien, thong bao va tro ly mua sam AI.

## Tech stack da xac minh

### Backend

- Java 17
- Spring Boot 3.5.4
- Spring Web, Validation, Security, Actuator, Cache, WebFlux
- Spring Data MongoDB
- Spring Data Redis
- JWT/JJWT va Google OAuth
- OpenAPI/Swagger qua springdoc
- Cloudinary
- Resend email
- Thymeleaf cho email/template phia server
- OpenAI cho chat, function calling, voice transcription va image analysis
- Gradle

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- TanStack React Query
- Redux Toolkit va React Redux
- Axios
- React Hook Form va Zod
- Radix UI, cmdk, Lucide React
- Framer Motion
- Recharts
- SheetJS/XLSX
- React Toastify
- Playwright

### Data va ha tang

- MongoDB 7
- Redis 7
- Docker va Docker Compose
- Redis Commander trong profile demo
- SePay cho thanh toan va IPN callback
- Cloudinary cho media

## Chuc nang da trien khai

### Storefront va tai khoan

- Duyet va tim kiem san pham theo danh muc, thuong hieu va thong tin san pham.
- Tim kiem full-text bang MongoDB text index.
- Dang ky, dang nhap, Google OAuth, quen mat khau/OTP va JWT session.
- Quan ly ho so, dia chi, wishlist, danh gia va thong bao.
- Ho tro gio hang cho khach va nguoi dung da dang nhap; co luong hop nhat gio hang.
- Giao dien checkout, lich su don hang va chi tiet don hang.

### Checkout, ton kho va thanh toan

- Kiem tra gio hang, dia chi, coupon va gia tai thoi diem checkout.
- Tao snapshot dia chi va du lieu don hang de bao toan lich su giao dich.
- Dat giu ton kho bang cap nhat atomic tren MongoDB.
- Xac nhan, giai phong va het han reservation ton kho.
- Tao payment SePay, xu ly callback/IPN va dong bo trang thai thanh toan.
- Xac minh callback bang secret header hoac HMAC signature, timestamp va constant-time comparison.
- Chong xu ly trung callback bang payment event/duplicate-key handling.
- Kiem tra so tien callback, het han payment va dong bo refund.
- Rollback/giai phong reservation khi checkout gap loi.

### Van hanh va quan tri

- Route va man hinh rieng cho customer, staff va admin.
- Quan ly san pham, thuong hieu, danh muc, ton kho, don hang, khuyen mai, danh gia va doi tra.
- RBAC voi Spring Security, method-level permission check va role gate phia frontend.
- Dashboard thong ke, bieu do, canh bao nghiep vu va xuat Excel.
- Thong bao luu trong database va cap nhat thoi gian thuc qua Server-Sent Events.
- Gui email cho cac su kien nghiep vu lien quan.

### Doi tra va hoan tien

- Tao yeu cau doi tra theo quyen so huu don hang va thoi han cho phep.
- Quy trinh duyet cua staff/manager, ghi chu noi bo va han gui hang tra.
- Kiem tra thong tin ngan hang phuc vu hoan tien.
- Trang thai refund pending/completed va cac side effect len payment, order, inventory, notification va email.
- Guard bao ve shop va kiem tra chuyen trang thai nghiep vu.

### AI shopping copilot

- Chat mua sam bang ngon ngu tu nhien.
- OpenAI function calling de truy van catalog, policy, order va return.
- RAG context dua tren du lieu/policy noi bo.
- Luu va tai lich su hoi thoai.
- Goi y san pham co cau truc.
- Voice input qua transcription.
- Image search: chuan hoa anh sang WebP, upload Cloudinary, phan tich anh va tim san pham phu hop.
- Xu ly canh bao cho guest khi truy cap cac tac vu can danh tinh.

## Diem ky thuat noi bat

1. Xay dung luong checkout co tinh nhat quan giua gio hang, coupon, order, payment va inventory reservation; co co che giai phong ton kho khi giao dich that bai.
2. Lam cung tich hop SePay bang signed payload, IPN authentication, timestamp validation, duplicate protection, amount validation va refund synchronization.
3. Trien khai ton kho bang atomic MongoDB updates thay vi read-modify-write de giam nguy co overselling.
4. Thiet ke RBAC cho admin/staff/customer voi route protection, method-level permission evaluation va Redis-backed permission behavior.
5. Xay dung quy trinh return/refund nhieu buoc voi validation, status transition, shop-protection guard va dong bo cac module lien quan.
6. Xay dung AI shopping copilot ket hop function calling, RAG, voice va image search voi cac tool nghiep vu thuc te.
7. Bo sung correlation ID, request logging, global exception handling, Redis-backed rate limiting va cau hinh production rieng.
8. Dong goi moi truong demo bang Docker Compose, env template, seed data va reindex flow.
9. Viet test cho cac luong co rui ro cao nhu checkout, inventory, payment/IPN, return, RBAC, cart merge, AI va search.

## Noi dung CV goi y

### Project description

**SOLE Shoe E-commerce** - Full-stack e-commerce platform supporting customer shopping journeys, staff operations, role-based administration, inventory reservation, SePay payments, returns/refunds, real-time notifications, and an AI shopping copilot.

### CV bullets - English

- Built a full-stack shoe e-commerce platform with Spring Boot 3.5, React 19, TypeScript, MongoDB, Redis, and Docker, supporting customer, staff, and administrator workflows.
- Implemented a transactional checkout flow covering cart validation, coupon pricing, order snapshots, atomic inventory reservation, payment creation, and reservation release on failure.
- Integrated SePay payments with signed requests, authenticated IPN callbacks, duplicate-event protection, amount validation, payment expiry, and refund synchronization.
- Developed role-based access control using Spring Security, method-level permissions, protected frontend routes, and Redis-backed permission behavior.
- Delivered an end-to-end return and refund workflow with eligibility validation, staff and manager review, bank refund details, status-transition guards, notifications, and inventory/payment side effects.
- Built an AI shopping copilot using OpenAI function calling and RAG, with catalog, policy, order, and return tools plus voice transcription and image-based product search.
- Improved operational readiness with Docker Compose, environment templates, seed data, correlation IDs, request logging, centralized exception handling, API documentation, and automated tests.
- Created administrative dashboards with operational alerts, charts, reporting, and Excel export for commerce workflows.

### CV bullets - Tieng Viet

- Xay dung nen tang thuong mai dien tu ban giay full-stack bang Spring Boot 3.5, React 19, TypeScript, MongoDB, Redis va Docker, phuc vu cac luong customer, staff va admin.
- Trien khai luong checkout gom kiem tra gio hang, tinh coupon, luu snapshot don hang, dat giu ton kho atomic, tao thanh toan va giai phong reservation khi loi.
- Tich hop SePay voi signed request, IPN authentication, chong callback trung, kiem tra so tien, xu ly payment het han va dong bo hoan tien.
- Xay dung RBAC bang Spring Security, method-level permissions, protected routes phia frontend va co che quyen co su dung Redis.
- Phat trien quy trinh return/refund end-to-end gom eligibility validation, staff/manager review, thong tin ngan hang, status guard, notification va dong bo inventory/payment.
- Xay dung AI shopping copilot bang OpenAI function calling va RAG, ket noi cac tool catalog, policy, order, return; ho tro voice transcription va image-based product search.
- Tang kha nang van hanh voi Docker Compose, env template, seed data, correlation ID, request logging, global exception handling, API documentation va automated tests.

## Cau hoi phong van co the khai thac

- Tai sao inventory reservation can atomic update, va he thong xu ly overselling nhu the nao?
- Luong checkout rollback khi payment/order creation that bai ra sao?
- IPN cua SePay duoc xac thuc va chong xu ly trung nhu the nao?
- RBAC duoc chia giua backend enforcement va frontend route protection ra sao?
- Return/refund state machine bao ve customer va shop bang nhung validation nao?
- AI function calling duoc gioi han tool, context va identity nhu the nao?
- SSE duoc dung de cap nhat notification va xu ly disconnect nhu the nao?
- Tai sao du an chuyen sang MongoDB full-text search thay cho Elasticsearch?

## Bang chung trong repository

- `README.md`: tong quan, stack, demo, seed data va huong dan chay.
- `be/build.gradle`: phien ban Java/Spring va dependency backend.
- `fe/package.json`: dependency, script build/test/e2e frontend.
- `docker-compose.yml`: MongoDB, Redis, backend, frontend va demo services.
- `.env.example`: bien cau hinh cho JWT, OAuth, Resend, Cloudinary, SePay, OpenAI, Redis va seed data.
- `be/src/main/java/www/config/SecurityConfig.java`: route security va role rules.
- `be/src/main/java/www/security/RateLimitFilter.java`: rate limiting bang Redis.
- `be/src/main/java/www/modules/checkout/service/CheckoutService.java`: checkout orchestration.
- `be/src/main/java/www/modules/inventory/service/InventoryService.java`: reservation va atomic stock updates.
- `be/src/main/java/www/modules/payments/service/EcommercePaymentService.java`: payment lifecycle va callback handling.
- `be/src/main/java/www/modules/payments/service/SePayIpnVerifier.java`: IPN verification.
- `be/src/main/java/www/modules/returns/service/ReturnService.java`: return/refund workflow.
- `be/src/main/java/www/modules/ai/controller/AiChatController.java`: chat, voice va image endpoints.
- `be/src/main/java/www/modules/ai/service/AiOrchestratorService.java`: function calling va AI orchestration.
- `be/src/main/java/www/modules/catalog/search/ProductTextSearchService.java`: MongoDB full-text search.
- `be/src/main/java/www/modules/notifications/service/NotificationService.java`: notification persistence.
- `be/src/main/java/www/modules/notifications/service/NotificationSseHub.java`: real-time SSE delivery.
- `fe/src/App.tsx`: route map cua storefront, customer, staff va admin.
- `fe/src/contexts/CartContext.tsx`: cart state, optimistic update va merge behavior.
- `fe/src/pages/admin/DashboardAdmin/DashboardAdmin.tsx`: dashboard van hanh.

## Muc do kiem thu da quan sat

Repository co backend unit/integration tests va frontend unit/e2e tests cho AI, cart, checkout, inventory, payments, promotions, RBAC, returns, search va cac release flow. Phan tich tinh tim thay **162 khai bao test** theo mau `@Test`, `test(...)` hoac `it(...)` trong cac tep test phu hop.

Con so 162 la ket qua dem tinh tren source, khong phai ket qua thuc thi. Chua chay test suite trong qua trinh tao tai lieu nay, vi vay khong duoc mo ta rang tat ca test dang pass.

## Thong tin chua du bang chung

Khong khang dinh cac noi dung sau neu chua co nguon bo sung:

- so nguoi dung, don hang, doanh thu hoac traffic thuc te;
- ty le tang hieu nang, giam loi hoac giam thoi gian xu ly;
- quy mo va vai tro cu the cua tung thanh vien trong team;
- CI/CD dang hoat dong tren GitHub Actions, GitLab CI hoac nen tang khac;
- deployment production tren cloud, Kubernetes, Nginx, CDN, monitoring hoac APM;
- load test, penetration test hay security audit chuyen sau;
- message queue hoac background worker rieng;
- toan bo 162 test dang pass.

## Huong dan cho AI tong hop

Khi tao noi dung tu tai lieu nay:

1. Uu tien thanh tuu ky thuat va quyet dinh kien truc co trong repository.
2. Phan biet ro tinh nang da trien khai voi dependency chi duoc khai bao.
3. Khong bien ket qua dem source thanh ket qua test execution.
4. Khong tao metric dinh luong neu nguoi dung khong cung cap.
5. Voi CV, chon 4-6 bullet lien quan nhat den vi tri ung tuyen; tranh liet ke tat ca cong nghe.
6. Voi phong van, tap trung vao trade-off cua checkout, inventory consistency, payment idempotency, RBAC, return/refund va AI tool orchestration.
