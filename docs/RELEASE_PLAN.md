# SOLE Release Plan — Tracking Checklist

Milestone: Soft launch sau R1, v1.0 sau R3, v1.1 sau R4.

## R0 — Security & smoke tests

- [x] `permission.enforcement=true` trên staging/prod
- [x] Payment Error/Cancel poll BE (`usePaymentVerification`)
- [x] Integration tests: payment IPN, inventory expire, checkout validation
- [x] `docs/STAGING_CHECKLIST.md`

## R1 — Ops workflow

- [x] Admin order detail page (`/admin/orders/:orderId`, `/staff/orders/:orderId`)
- [x] Return detail panel + `manualRefundRequired`
- [x] MyReturns orderCode mapping
- [x] `docs/RUNBOOK_REFUND.md`
- [x] Address book update/delete + ward/district
- [x] Checkout `customerNote`
- [x] Cart debounce validate
- [x] RBAC `@perm.has` mở rộng

## R2 — Guest cart & UX

- [x] Guest cart BE (`guestSessionId` + merge on login)
- [x] Guest cart FE (cookie/header, `/cart` public)
- [x] Wishlist/review/brand/AI/Home polish

## R3 — Hardening & E2E

- [x] ES prod config + review re-index hook
- [x] Inventory Mongo query scale
- [x] Playwright E2E smoke
- [x] Correlation ID filter
- [x] Admin re-index + low-stock widget

## R4 — Promotion & VAT (v1.1)

- [x] Module `promotions/` (coupon validator + checkout)
- [x] VAT calculator
- [x] Admin + checkout FE
