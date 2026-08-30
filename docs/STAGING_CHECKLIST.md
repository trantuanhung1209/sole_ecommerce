# Staging / Production Go-Live Checklist

## Bảo mật

- [ ] `permission.enforcement=true` (không dùng `false` trên staging/prod)
- [ ] `JWT_SECRET` ≥ 32 ký tự, không dùng giá trị dev
- [ ] `COOKIE_SECURE=true` khi HTTPS
- [ ] `COOKIE_DOMAIN` khớp domain FE production
- [ ] CORS `CORS_ALLOWED_ORIGINS` chỉ domain FE thật
- [ ] Swagger UI tắt public trên prod (`spring.profiles.active=prod`)

## Hạ tầng

- [ ] MongoDB URI production + backup
- [ ] Redis reachable từ BE
- [ ] Mail SMTP / Resend hoạt động (test OTP + order confirmation)
- [ ] Cloudinary credentials

## SePay

- [ ] `SEPAY_MERCHANT_ID`, `SEPAY_SECRET_KEY` production hoặc sandbox đúng môi trường
- [ ] `SEPAY_IPN_URL` public HTTPS: `{API}/payments/sepay/callback`
- [ ] Smoke: checkout → IPN → order PAID → reservation CONFIRMED

## Ứng dụng

- [ ] `FRONTEND_BASE_URL` redirect payment success/error/cancel
- [ ] `./gradlew test` pass
- [ ] `npm test` pass

## Smoke manual (15 phút)

1. Register + verify OTP
2. Login → add cart → checkout → SePay sandbox
3. Payment success page xác nhận BE
4. Admin ship order + tracking
5. Return workflow: staff-confirm → approve → mark-received → request-refund → confirm-refund
