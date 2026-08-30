# Runbook — Hoàn tiền trả hàng (2 bước)

> Spec đầy đủ: [`RETURN_REFUND_SPEC.md`](./RETURN_REFUND_SPEC.md)

## Quy trình

1. **APPROVED** — Manager đã duyệt; khách có **7 ngày** gửi hàng về (`shipBackDeadlineAt`).
2. **RECEIVED** — Staff nhận hàng, chọn **tình trạng** (GOOD / DAMAGED / INCOMPLETE):
   - GOOD → restock + hoàn tối đa 100%
   - DAMAGED → không restock, hoàn tối đa 50%
   - INCOMPLETE → không restock, hoàn tối đa 30%
3. **Yêu cầu hoàn tiền** (Manager) → trạng thái **REFUND_PENDING**
   - Khách nhận thông báo: *"Cửa hàng đang xử lý khoản hoàn..."*
   - Order **chưa** chuyển `REFUNDED`
4. Manager **chuyển tiền thực tế** (Internet Banking / SePay Dashboard / tiền mặt).
5. **Xác nhận đã hoàn** (Manager) — nhập số tiền (≤ trần), mã giao dịch, phương thức, chứng từ (tuỳ chọn).
6. Trạng thái **REFUNDED** — khách nhận thông báo hoàn tiền thành công kèm mã GD.

## API

| Bước | Endpoint |
|------|----------|
| Nhận hàng + tình trạng | `POST /admin/returns/{id}/mark-received` |
| Tạo yêu cầu hoàn | `POST /admin/returns/{id}/request-refund` |
| Xác nhận đã chuyển | `POST /admin/returns/{id}/confirm-refund` |

## SePay / chuyển khoản

- Thanh toán gốc qua SePay (QR/CK) **không có API refund tổng quát** sau quyết toán.
- Manager hoàn bằng chuyển khoản thủ công hoặc công cụ SePay Merchant.
- Ghi **mã giao dịch hoàn** vào form xác nhận để audit.

## Audit

Mỗi return ở `REFUNDED` phải có:

- `itemCondition`, `maxRefundAmount`
- `refundAmount` (≤ trần)
- `refundTransactionRef`
- `refundMethod`
- `refundCompletedAt`
- `refundedBy`

Đơn ở `REFUND_PENDING` = đã đồng ý hoàn nhưng **chưa xác nhận chuyển tiền**.

## Cảnh báo vận hành

Dashboard (`GET /admin/reports/dashboard`):

- `overdueApprovedReturns` — đã duyệt nhưng quá hạn gửi hàng (scheduler auto-reject mỗi giờ)
- `staleRefundPendingReturns` — REFUND_PENDING > 3 ngày chưa confirm

Trang `/admin/returns` hiển thị banner khi có cảnh báo.

## Escalation

- Số tiền vượt trần → kiểm tra `itemCondition` / `maxRefundAmount` trước khi confirm.
- Manager quên chuyển tiền → filter `REFUND_PENDING` hoặc xem dashboard stale count.
- Khách gửi hàng quá hạn → return bị từ chối tự động; liên hệ CS nếu có ngoại lệ.
