# Runbook — Hoàn tiền thủ công SePay

Khi yêu cầu trả hàng có `manualRefundRequired=true`, hệ thống đã cập nhật trạng thái local (`REFUNDED`) nhưng **chưa** gọi API hoàn tiền SePay tự động.

## Khi nào áp dụng

- Return status = `REFUNDED` và flag `manualRefundRequired=true` trên admin Return Management.
- Thanh toán gốc qua SePay sandbox/prod.

## Quy trình Manager

1. Mở **Admin → Quản lý đổi/trả** → chọn yêu cầu có badge "Cần hoàn tiền thủ công".
2. Ghi nhận `orderCode`, `refundAmount`, ghi chú manager (`managerNote`).
3. Đăng nhập **SePay Merchant** → tìm giao dịch theo mã hóa đơn / order invoice.
4. Thực hiện hoàn tiền thủ công trên cổng SePay đúng số tiền `refundAmount`.
5. Lưu mã giao dịch hoàn tiền vào ghi chú nội bộ (ticket/CRM).
6. Thông báo khách qua email/phone khi SePay xác nhận.

## Kiểm tra

- Order payment status local = phù hợp với nghiệp vụ (đã REFUNDED trên return).
- Khách nhận được xác nhận hoàn tiền.

## Escalation

- Số tiền không khớp → dừng hoàn, liên hệ kế toán + dev kiểm tra snapshot order.
- SePay API sẵn sàng → chuyển sang auto-refund (backlog R4+).
