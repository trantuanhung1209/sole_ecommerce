# SOLE E-commerce — Gói triển khai VPS

Thư mục này chứa đủ cấu hình để kéo image multi-arch (`linux/amd64` + `linux/arm64`) từ Docker Hub và chạy trọn bộ Frontend + Backend + MongoDB + Redis + tự động seed dữ liệu.

## 1. Copy lên VPS

```bash
scp -r sole user@<VPS_IP>:~/sole
ssh user@<VPS_IP>
cd ~/sole
```

## 2. Tạo file `.env`

```bash
cp .env.example .env
nano .env
```

Cần điền các giá trị thật trong `.env`:
- `JWT_SECRET`: chuỗi ngẫu nhiên >= 32 ký tự (`openssl rand -hex 32`)
- `FRONTEND_BASE_URL` & `CORS_ALLOWED_ORIGINS`: domain HTTPS của bạn (ví dụ `https://shop.example.com`)
- `SEPAY_SECRET_KEY`, `SEPAY_MERCHANT_ID`, `SEPAY_IPN_URL`: thông tin SePay production (bắt buộc khi `SPRING_PROFILES_ACTIVE=prod`)
- *(Nếu chỉ test tạm bằng HTTP IP `http://<VPS_IP>` chưa có HTTPS)*: đặt `COOKIE_SECURE=false`, `SPRING_PROFILES_ACTIVE=docker`, `PERMISSION_ENFORCEMENT=true`.

## 3. Kéo image và khởi chạy

```bash
docker compose pull && docker compose up -d
```

Kiểm tra trạng thái & log khởi tạo:

```bash
docker compose ps
docker compose logs -f backend
```

> Ghi chú cổng: mặc định `FRONTEND_PORT=80` (Nginx trong container `frontend` tự proxy `/api/` sang `backend:8081`). Nếu VPS đã có Nginx/Caddy làm reverse proxy HTTPS ở cổng 80/443 bên ngoài, đổi `FRONTEND_PORT=3000` (hoặc `8080`) trong `.env` rồi proxy domain vào cổng đó.

## 4. Seed dữ liệu & Tài khoản demo

Ở lần khởi động đầu tiên (`*_SEED_ENABLED=true`), backend tự seed vào MongoDB:
- **11** thương hiệu, **9** danh mục, **28** sản phẩm, **28** đánh giá, **14** coupon, **20** đơn hàng, **11** yêu cầu đổi trả, **17** wishlist, **10** tài khoản demo.
- Mật khẩu mặc định theo `USER_SEED_PASSWORD` (`Sole@123`):
  - `customer@sole.test` (`CUSTOMER`)
  - `staff@sole.test` (`STAFF`)
  - `shopmanager@sole.test` (`SHOP_MANAGER`)
  - `admin@sole.test` (`ADMIN`)
  - `superadmin@sole.test` (`SUPER_ADMIN`)

Sau khi chạy xong lần đầu trên production, nên đặt `USER_SEED_ENABLED=false` và `DEMO_OPS_SEED_ENABLED=false` trong `.env`, rồi chạy `docker compose up -d` để áp dụng lại.

## 5. Re-seed giá sản phẩm 100–900 VNĐ trên VPS đang chạy (Test thanh toán thực tế)

Nếu VPS đã chạy từ trước với giá bán lẻ cũ, làm theo các bước sau trong thư mục `~/sole` để cập nhật toàn bộ biến thể sản phẩm về mức **100–900 VNĐ** và tắt phí ship `30.000 VNĐ` (giúp tổng đơn hàng test dưới `1.000 VNĐ`):

1. Mở `.env` và cập nhật:
   ```dotenv
   CATALOG_SEED_FORCE=true
   SHIPPING_FLAT_FEE=0
   SHIPPING_FREE_THRESHOLD=500
   ```
2. Kéo image backend mới nhất và khởi động lại container `backend`:
   ```bash
   docker compose pull backend && docker compose up -d backend
   ```
3. Sau khi kiểm tra giá sản phẩm trên web đã về mức 100–900 VNĐ, đổi lại `CATALOG_SEED_FORCE=false` trong `.env` rồi chạy `docker compose up -d backend` để các lần khởi động sau không ghi đè dữ liệu.
