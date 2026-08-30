package www.modules.returns.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.exception.ForbiddenException;
import www.exception.NotFoundException;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.common.EcommerceEnums.NotificationType;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.common.EcommerceEnums.RefundStatus;
import www.modules.common.EcommerceEnums.ReturnItemCondition;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.inventory.service.InventoryService;
import www.modules.notifications.service.NotificationService;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.repository.OrderRepository;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.returns.dto.ReturnDtos.*;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.repository.ReturnRequestRepository;
import www.service.implement.OrderMailNotifier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReturnService {
    private static final int RETURN_WINDOW_DAYS = ReturnRefundPolicy.RETURN_WINDOW_DAYS;

    private final ReturnRequestRepository returnRepository;
    private final OrderRepository orderRepository;
    private final OrderMailNotifier orderMailNotifier;
    private final NotificationService notificationService;
    private final EcommercePaymentService paymentService;
    private final InventoryService inventoryService;

    public Page<ReturnRequest> mine(String userId, Pageable pageable) {
        return returnRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Page<ReturnRequest> adminList(ReturnStatus status, Pageable pageable) {
        return status == null
                ? returnRepository.findAllByOrderByCreatedAtDesc(pageable)
                : returnRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    public ReturnRequest get(String returnId) {
        return returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnId));
    }

    public ReturnRequest getOwned(String returnId, String userId) {
        ReturnRequest returnRequest = get(returnId);
        if (!userId.equals(returnRequest.getUserId())) {
            throw new ForbiddenException("Cannot access another customer's return request");
        }
        return returnRequest;
    }

    public ReturnRequest create(String userId, CreateReturnRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + request.getOrderId()));
        if (!userId.equals(order.getUserId())) {
            throw new BadRequestException("Cannot return another customer's order");
        }
        if (order.getStatus() != OrderStatus.DELIVERED
                && order.getStatus() != OrderStatus.COMPLETED
                && order.getStatus() != OrderStatus.RETURN_REQUESTED) {
            throw new BadRequestException("Only delivered orders can be returned");
        }
        validateReturnWindow(order);
        validateRefundBankDetails(request);
        if (returnRepository.findByOrderIdAndOrderItemId(order.getOrderId(), request.getOrderItemId()).isPresent()) {
            throw new BadRequestException("Return request already exists for this order item");
        }
        OrderItem item = order.getItems().stream()
                .filter(orderItem -> request.getOrderItemId().equals(orderItem.getOrderItemId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order item not found: " + request.getOrderItemId()));
        item.setReturnStatus(ReturnStatus.PENDING.name());
        order.setStatus(OrderStatus.RETURN_REQUESTED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        ReturnRequest saved = returnRepository.save(ReturnRequest.builder()
                .orderId(order.getOrderId())
                .orderItemId(item.getOrderItemId())
                .userId(userId)
                .reason(request.getReason())
                .customerNote(request.getCustomerNote())
                .imageUrls(request.getImageUrls())
                .refundBankName(normalizeBankField(request.getRefundBankName()))
                .refundAccountNumber(normalizeBankField(request.getRefundAccountNumber()))
                .refundAccountHolder(normalizeBankField(request.getRefundAccountHolder()))
                .status(ReturnStatus.PENDING)
                .refundStatus(RefundStatus.NOT_REQUIRED)
                .refundAmount(item.getLineTotal())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        notificationService.create(
                userId,
                NotificationType.RETURN_REQUESTED,
                "Yêu cầu trả hàng",
                "Yêu cầu trả hàng cho đơn " + order.getOrderCode() + " đã được gửi",
                "/orders/" + order.getOrderId());
        notificationService.notifyStaff(
                NotificationType.STAFF_NEW_RETURN,
                "Yêu cầu trả hàng mới",
                "Khách hàng yêu cầu trả hàng đơn " + order.getOrderCode(),
                "/admin/returns");
        return saved;
    }

    public ReturnRequest updateStatus(String returnId, UpdateReturnStatusRequest request) {
        if (request.getStatus() != null) {
            request.setStatus(normalizeStatus(request.getStatus()));
        }
        if (request.getStatus() == ReturnStatus.REFUND_PENDING || request.getStatus() == ReturnStatus.REFUNDED) {
            throw new BadRequestException("Dùng API request-refund / confirm-refund cho các bước hoàn tiền");
        }
        if (request.getStatus() == ReturnStatus.RECEIVED) {
            throw new BadRequestException("Dùng API mark-received để xác nhận nhận hàng và tình trạng sản phẩm");
        }
        ReturnRequest returnRequest = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnId));
        ReturnStatus previousStatus = returnRequest.getStatus();
        ReturnStatus nextStatus = request.getStatus();
        ReturnStatusTransition.validate(previousStatus, nextStatus);

        LocalDateTime now = LocalDateTime.now();
        returnRequest.setStatus(nextStatus);
        returnRequest.setUpdatedAt(now);

        if (nextStatus == ReturnStatus.STAFF_CONFIRMED) {
            returnRequest.setStaffNote(request.getNote());
            returnRequest.setStaffConfirmedAt(now);
        }
        if (nextStatus == ReturnStatus.APPROVED && request.getNote() != null && !request.getNote().isBlank()) {
            returnRequest.setManagerNote(request.getNote());
        }
        if (nextStatus == ReturnStatus.APPROVED) {
            returnRequest.setApprovedAt(now);
            returnRequest.setShipBackDeadlineAt(now.plusDays(ReturnRefundPolicy.SHIP_BACK_DEADLINE_DAYS));
        }
        if (nextStatus == ReturnStatus.REJECTED) {
            String rejectedReason = request.getRejectedReason();
            if (rejectedReason == null || rejectedReason.trim().length() < 10) {
                throw new BadRequestException("Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự)");
            }
            returnRequest.setRejectedReason(rejectedReason.trim());
            returnRequest.setRejectedAt(now);
        }

        ReturnRequest saved = returnRepository.save(returnRequest);
        applyOrderSideEffects(saved, nextStatus);

        if (nextStatus == ReturnStatus.REJECTED) {
            orderMailNotifier.sendReturnRejected(
                    orderRepository.findById(saved.getOrderId()).orElse(null), saved);
        }
        if (shouldSendReturnApprovedEmail(previousStatus, nextStatus)) {
            Order order = orderRepository.findById(saved.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found: " + saved.getOrderId()));
            orderMailNotifier.sendReturnApproved(order, saved);
        }
        notifyReturnStatus(saved, nextStatus);
        return saved;
    }

    public ReturnRequest requestRefund(String returnId, String managerId, UpdateReturnStatusRequest request) {
        ReturnRequest returnRequest = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnId));
        ReturnStatusTransition.validate(returnRequest.getStatus(), ReturnStatus.REFUND_PENDING);

        LocalDateTime now = LocalDateTime.now();
        returnRequest.setStatus(ReturnStatus.REFUND_PENDING);
        returnRequest.setRefundStatus(RefundStatus.PENDING);
        returnRequest.setRefundRequestedAt(now);
        returnRequest.setRefundRequestedBy(managerId);
        returnRequest.setUpdatedAt(now);
        if (request != null && request.getNote() != null && !request.getNote().isBlank()) {
            returnRequest.setRefundNote(request.getNote().trim());
        }

        ReturnRequest saved = returnRepository.save(returnRequest);
        syncOrderItemReturnStatus(saved.getOrderId(), saved.getOrderItemId(), ReturnStatus.REFUND_PENDING);
        paymentService.markRefundPending(saved.getOrderId());
        notifyRefundPending(saved);
        return saved;
    }

    public ReturnRequest confirmRefund(String returnId, String managerId, ConfirmRefundRequest body) {
        ReturnRequest returnRequest = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnId));
        ReturnStatusTransition.validate(returnRequest.getStatus(), ReturnStatus.REFUNDED);

        if (body.getAmount() == null || body.getAmount() <= 0) {
            throw new BadRequestException("Số tiền hoàn phải lớn hơn 0");
        }
        if (body.getTransactionRef() == null || body.getTransactionRef().trim().length() < 3) {
            throw new BadRequestException("Vui lòng nhập mã giao dịch hoàn tiền");
        }
        if (body.getMethod() == null) {
            throw new BadRequestException("Vui lòng chọn phương thức hoàn tiền");
        }
        validateRefundAmount(returnRequest, body.getAmount());

        LocalDateTime now = LocalDateTime.now();
        returnRequest.setStatus(ReturnStatus.REFUNDED);
        returnRequest.setRefundStatus(RefundStatus.COMPLETED);
        returnRequest.setRefundAmount(body.getAmount());
        returnRequest.setRefundMethod(body.getMethod());
        returnRequest.setRefundTransactionRef(body.getTransactionRef().trim());
        returnRequest.setRefundProofUrl(body.getProofUrl());
        if (body.getNote() != null && !body.getNote().isBlank()) {
            returnRequest.setRefundNote(body.getNote().trim());
        }
        returnRequest.setRefundedBy(managerId);
        returnRequest.setRefundedAt(now);
        returnRequest.setRefundCompletedAt(now);
        returnRequest.setClosedAt(now);
        returnRequest.setUpdatedAt(now);

        ReturnRequest saved = returnRepository.save(returnRequest);
        completeFinancialRefund(saved);
        notifyRefundCompleted(saved);
        return saved;
    }

    private void completeFinancialRefund(ReturnRequest returnRequest) {
        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + returnRequest.getOrderId()));
        order.setStatus(OrderStatus.REFUNDED);
        order.setPaymentStatus(EcommercePaymentStatus.REFUNDED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        syncOrderItemReturnStatus(returnRequest.getOrderId(), returnRequest.getOrderItemId(), ReturnStatus.REFUNDED);
        paymentService.markRefundCompleted(
                returnRequest.getOrderId(),
                returnRequest.getRefundAmount(),
                returnRequest.getRefundMethod(),
                returnRequest.getRefundTransactionRef(),
                returnRequest.getRefundProofUrl(),
                returnRequest.getRefundNote());
    }

    private void applyOrderSideEffects(ReturnRequest returnRequest, ReturnStatus newStatus) {
        if (newStatus == ReturnStatus.REJECTED) {
            Order order = orderRepository.findById(returnRequest.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found: " + returnRequest.getOrderId()));
            syncOrderItemReturnStatus(returnRequest.getOrderId(), returnRequest.getOrderItemId(), newStatus);
            syncOrderReturnState(order);
            return;
        }
        if (newStatus == ReturnStatus.RECEIVED) {
            Order order = orderRepository.findById(returnRequest.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found: " + returnRequest.getOrderId()));
            syncOrderItemReturnStatus(returnRequest.getOrderId(), returnRequest.getOrderItemId(), newStatus);
            order.setStatus(OrderStatus.RETURNED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            return;
        }
        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + returnRequest.getOrderId()));
        syncOrderItemReturnStatus(returnRequest.getOrderId(), returnRequest.getOrderItemId(), newStatus);
        order.setStatus(OrderStatus.RETURN_REQUESTED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private void syncOrderItemReturnStatus(String orderId, String orderItemId, ReturnStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        order.getItems().stream()
                .filter(item -> orderItemId.equals(item.getOrderItemId()))
                .findFirst()
                .ifPresent(item -> item.setReturnStatus(status.name()));
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private void syncOrderReturnState(Order order) {
        boolean hasOpen = returnRepository.findByOrderId(order.getOrderId()).stream()
                .anyMatch(r -> ReturnStatusTransition.isOpen(r.getStatus()));
        if (hasOpen) {
            order.setStatus(OrderStatus.RETURN_REQUESTED);
        } else if (order.getStatus() == OrderStatus.RETURN_REQUESTED
                || order.getStatus() == OrderStatus.RETURNED) {
            order.setStatus(resolvePreReturnOrderStatus(order));
        }
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private OrderStatus resolvePreReturnOrderStatus(Order order) {
        if (order.getCompletedAt() != null) {
            return OrderStatus.COMPLETED;
        }
        if (order.getDeliveredAt() != null) {
            return OrderStatus.DELIVERED;
        }
        return OrderStatus.COMPLETED;
    }

    private void notifyReturnStatus(ReturnRequest saved, ReturnStatus status) {
        String orderCode = resolveOrderCode(saved.getOrderId());
        if (status == ReturnStatus.APPROVED) {
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.RETURN_APPROVED,
                    "Yêu cầu trả hàng được duyệt",
                    "Vui lòng gửi hàng về cửa hàng trong "
                            + ReturnRefundPolicy.SHIP_BACK_DEADLINE_DAYS
                            + " ngày. Đơn hàng #"
                            + orderCode
                            + " đã được duyệt.",
                    "/returns");
        } else if (status == ReturnStatus.REJECTED) {
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.RETURN_REJECTED,
                    "Yêu cầu trả hàng bị từ chối",
                    "Yêu cầu trả hàng cho đơn #" + orderCode + " đã bị từ chối.",
                    "/orders/" + saved.getOrderId());
        }
    }

    private void notifyRefundPending(ReturnRequest saved) {
        String orderCode = resolveOrderCode(saved.getOrderId());
        String amount = formatMoney(saved.getRefundAmount());
        notificationService.create(
                saved.getUserId(),
                NotificationType.REFUND_PENDING,
                "Yêu cầu hoàn tiền đã được chấp nhận",
                "Cửa hàng đang xử lý khoản hoàn " + amount + " cho đơn hàng #" + orderCode + ".",
                "/returns");
    }

    private void notifyRefundCompleted(ReturnRequest saved) {
        String orderCode = resolveOrderCode(saved.getOrderId());
        String amount = formatMoney(saved.getRefundAmount());
        notificationService.create(
                saved.getUserId(),
                NotificationType.REFUND_COMPLETED,
                "Hoàn tiền thành công",
                "Cửa hàng đã thực hiện hoàn " + amount + " cho đơn hàng #" + orderCode
                        + ". Mã giao dịch: " + saved.getRefundTransactionRef() + ".",
                "/returns");
    }

    private String formatMoney(Double amount) {
        if (amount == null) {
            return "0đ";
        }
        return String.format(Locale.forLanguageTag("vi-VN"), "%,.0fđ", amount);
    }

    private String resolveOrderCode(String orderId) {
        return orderRepository.findById(orderId)
                .map(Order::getOrderCode)
                .orElse(orderId);
    }

    private void validateRefundBankDetails(CreateReturnRequest request) {
        if (request.getRefundBankName() == null || request.getRefundBankName().isBlank()) {
            throw new BadRequestException("Vui lòng nhập tên ngân hàng nhận hoàn tiền");
        }
        if (request.getRefundAccountNumber() == null || !request.getRefundAccountNumber().trim().matches("\\d{6,20}")) {
            throw new BadRequestException("Số tài khoản nhận hoàn phải gồm 6–20 chữ số");
        }
        if (request.getRefundAccountHolder() == null || request.getRefundAccountHolder().trim().length() < 2) {
            throw new BadRequestException("Vui lòng nhập tên chủ tài khoản nhận hoàn");
        }
    }

    private String normalizeBankField(String value) {
        return value == null ? null : value.trim().replaceAll("\\s+", " ");
    }

    public ReturnRequest staffConfirm(String returnId, UpdateReturnStatusRequest request) {
        UpdateReturnStatusRequest body = request != null ? request : new UpdateReturnStatusRequest();
        body.setStatus(ReturnStatus.STAFF_CONFIRMED);
        return updateStatus(returnId, body);
    }

    public ReturnRequest reject(String returnId, UpdateReturnStatusRequest request) {
        UpdateReturnStatusRequest body = request != null ? request : new UpdateReturnStatusRequest();
        body.setStatus(ReturnStatus.REJECTED);
        return updateStatus(returnId, body);
    }

    public ReturnRequest approve(String returnId, UpdateReturnStatusRequest request) {
        UpdateReturnStatusRequest body = request != null ? request : new UpdateReturnStatusRequest();
        body.setStatus(ReturnStatus.APPROVED);
        return updateStatus(returnId, body);
    }

    public ReturnRequest markReceived(String returnId, MarkReceivedRequest request) {
        if (request == null || request.getItemCondition() == null) {
            throw new BadRequestException("Vui lòng chọn tình trạng hàng nhận");
        }
        ReturnItemCondition condition = request.getItemCondition();
        if (condition != ReturnItemCondition.GOOD
                && (request.getReceiveNote() == null || request.getReceiveNote().trim().length() < 10)) {
            throw new BadRequestException("Hàng hỏng/thiếu phải ghi chú kiểm tra (tối thiểu 10 ký tự)");
        }

        ReturnRequest returnRequest = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnId));
        ReturnStatusTransition.validate(returnRequest.getStatus(), ReturnStatus.RECEIVED);

        LocalDateTime now = LocalDateTime.now();
        if (returnRequest.getShipBackDeadlineAt() != null && now.isAfter(returnRequest.getShipBackDeadlineAt())) {
            throw new BadRequestException("Quá hạn gửi hàng trả (" + ReturnRefundPolicy.SHIP_BACK_DEADLINE_DAYS + " ngày sau khi duyệt)");
        }

        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + returnRequest.getOrderId()));
        OrderItem item = order.getItems().stream()
                .filter(orderItem -> returnRequest.getOrderItemId().equals(orderItem.getOrderItemId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order item not found: " + returnRequest.getOrderItemId()));

        double lineTotal = item.getLineTotal() != null ? item.getLineTotal() : 0;
        double maxRefund = ReturnRefundPolicy.computeMaxRefundAmount(lineTotal, condition);

        returnRequest.setStatus(ReturnStatus.RECEIVED);
        returnRequest.setItemCondition(condition);
        returnRequest.setReceiveNote(request.getReceiveNote() != null ? request.getReceiveNote().trim() : null);
        returnRequest.setMaxRefundAmount(maxRefund);
        returnRequest.setRefundAmount(maxRefund);
        returnRequest.setReceivedAt(now);
        returnRequest.setUpdatedAt(now);
        if (request.getNote() != null && !request.getNote().isBlank()) {
            returnRequest.setStaffNote(request.getNote().trim());
        }

        ReturnRequest saved = returnRepository.save(returnRequest);
        if (ReturnRefundPolicy.shouldRestock(condition)) {
            restockReturnItem(saved);
        }
        applyOrderSideEffects(saved, ReturnStatus.RECEIVED);
        return saved;
    }

    public int expireOverdueShipBackReturns() {
        LocalDateTime now = LocalDateTime.now();
        List<ReturnRequest> overdue = returnRepository.findByStatusAndShipBackDeadlineAtBefore(
                ReturnStatus.APPROVED, now);
        int count = 0;
        for (ReturnRequest returnRequest : overdue) {
            UpdateReturnStatusRequest rejectBody = new UpdateReturnStatusRequest();
            rejectBody.setStatus(ReturnStatus.REJECTED);
            rejectBody.setRejectedReason(
                    "Quá hạn gửi hàng trả trong " + ReturnRefundPolicy.SHIP_BACK_DEADLINE_DAYS
                            + " ngày kể từ khi yêu cầu được duyệt");
            reject(returnRequest.getReturnId(), rejectBody);
            count++;
        }
        return count;
    }

    private void validateRefundAmount(ReturnRequest returnRequest, Double amount) {
        if (amount == null || amount <= 0) {
            throw new BadRequestException("Số tiền hoàn phải lớn hơn 0");
        }
        double itemCap = returnRequest.getMaxRefundAmount() != null
                ? returnRequest.getMaxRefundAmount()
                : (returnRequest.getRefundAmount() != null ? returnRequest.getRefundAmount() : 0);
        if (itemCap <= 0) {
            throw new BadRequestException("Không có số tiền hoàn hợp lệ cho yêu cầu này");
        }
        Double paymentAmount = paymentService.byOrder(returnRequest.getOrderId()).getAmount();
        double paymentCap = paymentAmount != null && paymentAmount > 0 ? paymentAmount : itemCap;
        double cap = Math.min(itemCap, paymentCap);
        if (amount > cap + 0.01) {
            throw new BadRequestException(
                    "Số tiền hoàn không được vượt quá " + formatMoney(cap) + " (theo tình trạng hàng và đơn thanh toán)");
        }
    }

    private void validateReturnWindow(Order order) {
        if (order.getDeliveredAt() == null) {
            throw new BadRequestException("Order delivery date is not recorded");
        }
        if (order.getDeliveredAt().isBefore(LocalDateTime.now().minusDays(RETURN_WINDOW_DAYS))) {
            throw new BadRequestException("Return window expired (" + RETURN_WINDOW_DAYS + " days after delivery)");
        }
    }

    private void restockReturnItem(ReturnRequest returnRequest) {
        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + returnRequest.getOrderId()));
        OrderItem item = order.getItems().stream()
                .filter(orderItem -> returnRequest.getOrderItemId().equals(orderItem.getOrderItemId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order item not found: " + returnRequest.getOrderItemId()));
        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
        inventoryService.restock(item.getVariantId(), qty);
    }

    private ReturnStatus normalizeStatus(ReturnStatus status) {
        if (status == ReturnStatus.CONFIRMED) {
            return ReturnStatus.STAFF_CONFIRMED;
        }
        return status;
    }

    private boolean shouldSendReturnApprovedEmail(ReturnStatus previousStatus, ReturnStatus newStatus) {
        return newStatus == ReturnStatus.APPROVED;
    }
}
