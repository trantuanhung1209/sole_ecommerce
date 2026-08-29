package www.modules.orders.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.exception.ForbiddenException;
import www.exception.NotFoundException;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.common.EcommerceEnums.FulfillmentStatus;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.inventory.service.InventoryService;
import www.modules.orders.model.Order;
import www.modules.orders.repository.OrderRepository;
import www.modules.returns.repository.ReturnRequestRepository;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.service.implement.OrderMailNotifier;
import www.modules.notifications.service.NotificationService;
import www.modules.common.EcommerceEnums.NotificationType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final OrderMailNotifier orderMailNotifier;
    private final NotificationService notificationService;
    private final ReturnRequestRepository returnRequestRepository;

    public String nextOrderCode() {
        return "SO-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public Order save(Order order) {
        return orderRepository.save(order);
    }

    public Order getOwned(String orderId, String userId) {
        Order order = get(orderId);
        if (!order.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only access your own order");
        }
        return order;
    }

    public Order get(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
    }

    public Page<Order> mine(String userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Page<Order> adminList(OrderStatus status, String search, Pageable pageable) {
        boolean hasSearch = search != null && !search.isBlank();
        String keyword = hasSearch ? search.trim() : null;
        if (hasSearch && status != null) {
            return orderRepository.findByOrderCodeContainingIgnoreCaseAndStatus(keyword, status, pageable);
        }
        if (hasSearch) {
            return orderRepository.findByOrderCodeContainingIgnoreCase(keyword, pageable);
        }
        return status == null ? orderRepository.findAll(pageable) : orderRepository.findByStatus(status, pageable);
    }

    public Order markPaid(String orderId) {
        Order order = get(orderId);
        if (order.getPaymentStatus() == EcommercePaymentStatus.COMPLETED) {
            return order;
        }
        order.setPaymentStatus(EcommercePaymentStatus.COMPLETED);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaidAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        inventoryService.confirmOrderReservations(orderId);
        Order saved = orderRepository.save(order);
        orderMailNotifier.sendOrderConfirmation(saved);
        notificationService.create(
                saved.getUserId(),
                NotificationType.ORDER_PAID,
                "Thanh toán thành công",
                "Đơn " + saved.getOrderCode() + " đã được xác nhận",
                "/orders/" + saved.getOrderId());
        return saved;
    }

    public Order cancel(String orderId, String reason) {
        Order order = get(orderId);
        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED
                || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel order after shipment");
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(EcommercePaymentStatus.CANCELLED);
        order.setCancelReason(reason);
        order.setCancelledAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        inventoryService.releaseOrderReservations(orderId);
        Order saved = orderRepository.save(order);
        notificationService.create(
                saved.getUserId(),
                NotificationType.ORDER_CANCELLED,
                "Đơn hàng đã hủy",
                "Đơn " + saved.getOrderCode() + " đã bị hủy",
                "/orders/" + saved.getOrderId());
        return saved;
    }

    public Order updateStatus(String orderId, OrderStatus status) {
        return updateStatus(orderId, status, null);
    }

    public Order updateStatus(String orderId, OrderStatus status, String trackingCode) {
        Order order = get(orderId);
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        if (status == OrderStatus.PROCESSING) {
            order.setFulfillmentStatus(FulfillmentStatus.PROCESSING);
        } else if (status == OrderStatus.SHIPPED) {
            order.setFulfillmentStatus(FulfillmentStatus.SHIPPED);
            if (trackingCode != null && !trackingCode.isBlank()) {
                order.setTrackingCode(trackingCode.trim());
            }
        } else if (status == OrderStatus.DELIVERED) {
            order.setFulfillmentStatus(FulfillmentStatus.DELIVERED);
            order.setDeliveredAt(LocalDateTime.now());
        } else if (status == OrderStatus.COMPLETED) {
            order.setCompletedAt(LocalDateTime.now());
        }
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        if (status == OrderStatus.SHIPPED && previousStatus != OrderStatus.SHIPPED) {
            orderMailNotifier.sendOrderShipped(saved);
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.ORDER_SHIPPED,
                    "Đơn hàng đang giao",
                    "Đơn " + saved.getOrderCode() + " đã được giao cho đơn vị vận chuyển",
                    "/orders/" + saved.getOrderId());
        }
        if (status == OrderStatus.DELIVERED && previousStatus != OrderStatus.DELIVERED) {
            orderMailNotifier.sendOrderDelivered(saved);
            notificationService.create(
                    saved.getUserId(),
                    NotificationType.ORDER_DELIVERED,
                    "Giao hàng thành công",
                    "Đơn " + saved.getOrderCode() + " đã giao thành công",
                    "/orders/" + saved.getOrderId());
        }
        return saved;
    }

    public int autoCompleteDeliveredOrders(int daysAfterDelivery) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysAfterDelivery);
        List<Order> candidates = orderRepository.findByStatusAndDeliveredAtBefore(OrderStatus.DELIVERED, cutoff);
        int count = 0;
        for (Order order : candidates) {
            boolean hasOpenReturn = returnRequestRepository.findByOrderId(order.getOrderId()).stream()
                    .anyMatch(r -> r.getStatus() != ReturnStatus.REJECTED
                            && r.getStatus() != ReturnStatus.CLOSED
                            && r.getStatus() != ReturnStatus.REFUNDED);
            if (hasOpenReturn) {
                continue;
            }
            order.setStatus(OrderStatus.COMPLETED);
            order.setCompletedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            count++;
        }
        return count;
    }
}
