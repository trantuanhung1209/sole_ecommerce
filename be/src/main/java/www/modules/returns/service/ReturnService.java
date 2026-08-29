package www.modules.returns.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.exception.ForbiddenException;
import www.exception.NotFoundException;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.repository.OrderRepository;
import www.modules.returns.dto.ReturnDtos.*;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.repository.ReturnRequestRepository;
import www.service.implement.OrderMailNotifier;
import www.modules.notifications.service.NotificationService;
import www.modules.common.EcommerceEnums.NotificationType;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReturnService {
    private final ReturnRequestRepository returnRepository;
    private final OrderRepository orderRepository;
    private final OrderMailNotifier orderMailNotifier;
    private final NotificationService notificationService;

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
        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Only delivered orders can be returned");
        }
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
                .status(ReturnStatus.PENDING)
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
        ReturnRequest returnRequest = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnId));
        ReturnStatus previousStatus = returnRequest.getStatus();
        returnRequest.setStatus(request.getStatus());
        returnRequest.setUpdatedAt(LocalDateTime.now());
        if (request.getStatus() == ReturnStatus.STAFF_CONFIRMED) {
            returnRequest.setStaffNote(request.getNote());
        }
        if (request.getStatus() == ReturnStatus.APPROVED || request.getStatus() == ReturnStatus.REFUNDED) {
            returnRequest.setManagerNote(request.getNote());
        }
        if (request.getStatus() == ReturnStatus.REJECTED) {
            returnRequest.setRejectedReason(request.getRejectedReason());
        }
        if (request.getRefundAmount() != null) {
            returnRequest.setRefundAmount(request.getRefundAmount());
        }
        if (request.getStatus() == ReturnStatus.CLOSED || request.getStatus() == ReturnStatus.REFUNDED) {
            returnRequest.setClosedAt(LocalDateTime.now());
        }
        ReturnRequest saved = returnRepository.save(returnRequest);
        if (shouldSendReturnApprovedEmail(previousStatus, request.getStatus())) {
            Order order = orderRepository.findById(saved.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found: " + saved.getOrderId()));
            orderMailNotifier.sendReturnApproved(order, saved);
        }
        notifyReturnStatus(saved, request.getStatus());
        return saved;
    }

    private void notifyReturnStatus(ReturnRequest saved, ReturnStatus status) {
        if (status == ReturnStatus.APPROVED) {
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.RETURN_APPROVED,
                    "Yêu cầu trả hàng được duyệt",
                    "Yêu cầu trả hàng đơn " + saved.getOrderId() + " đã được duyệt",
                    "/orders/" + saved.getOrderId());
        } else if (status == ReturnStatus.REJECTED) {
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.RETURN_REJECTED,
                    "Yêu cầu trả hàng bị từ chối",
                    "Yêu cầu trả hàng của bạn đã bị từ chối",
                    "/orders/" + saved.getOrderId());
        } else if (status == ReturnStatus.REFUNDED) {
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.REFUND_COMPLETED,
                    "Hoàn tiền thành công",
                    "Hoàn tiền cho đơn " + saved.getOrderId() + " đã hoàn tất",
                    "/orders/" + saved.getOrderId());
        }
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

    public ReturnRequest markReceived(String returnId, UpdateReturnStatusRequest request) {
        UpdateReturnStatusRequest body = request != null ? request : new UpdateReturnStatusRequest();
        body.setStatus(ReturnStatus.RECEIVED);
        return updateStatus(returnId, body);
    }

    public ReturnRequest refund(String returnId, UpdateReturnStatusRequest request) {
        UpdateReturnStatusRequest body = request != null ? request : new UpdateReturnStatusRequest();
        body.setStatus(ReturnStatus.REFUNDED);
        return updateStatus(returnId, body);
    }

    private ReturnStatus normalizeStatus(ReturnStatus status) {
        if (status == ReturnStatus.CONFIRMED) {
            return ReturnStatus.STAFF_CONFIRMED;
        }
        return status;
    }

    private boolean shouldSendReturnApprovedEmail(ReturnStatus previousStatus, ReturnStatus newStatus) {
        if (newStatus == ReturnStatus.APPROVED) {
            return true;
        }
        return newStatus == ReturnStatus.REFUNDED && previousStatus != ReturnStatus.APPROVED;
    }
}
