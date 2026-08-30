package www.modules.payments.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.BadRequestException;
import www.exception.NotFoundException;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.orders.model.Order;
import www.modules.orders.service.OrderService;
import www.modules.notifications.service.NotificationService;
import www.service.implement.OrderMailNotifier;
import www.modules.common.EcommerceEnums.NotificationType;
import www.modules.payments.dto.PaymentDtos.PaymentCheckoutResponse;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.model.PaymentEvent;
import www.modules.payments.repository.EcommercePaymentRepository;
import www.modules.payments.repository.PaymentEventRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EcommercePaymentService {
    private final EcommercePaymentRepository paymentRepository;
    private final PaymentEventRepository eventRepository;
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final OrderMailNotifier orderMailNotifier;
    private final ObjectMapper objectMapper;
    private final SePayCheckoutSigner sePayCheckoutSigner;
    private final SePayIpnParser sePayIpnParser;

    @Value("${sepay.api-url:https://pay-sandbox.sepay.vn/v1/checkout/init}")
    private String sepayUrl;
    @Value("${frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    private String paymentRedirectUrl(String path, Order order) {
        return frontendBaseUrl + path
                + "?orderId=" + order.getOrderId()
                + "&orderCode=" + order.getOrderCode();
    }

    public PaymentCheckoutResponse createPayment(Order order) {
        EcommercePayment existing = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(order.getOrderId())
                .filter(p -> p.getStatus() == EcommercePaymentStatus.PENDING || p.getStatus() == EcommercePaymentStatus.COMPLETED)
                .orElse(null);
        if (existing != null) {
            return toCheckoutResponse(existing);
        }

        LocalDateTime now = LocalDateTime.now();
        EcommercePayment payment = paymentRepository.save(EcommercePayment.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .orderInvoiceNumber("ORDER_" + order.getOrderCode() + "_" + System.currentTimeMillis())
                .amount(order.getGrandTotal())
                .successUrl(paymentRedirectUrl("/payment/success", order))
                .errorUrl(paymentRedirectUrl("/payment/error", order))
                .cancelUrl(paymentRedirectUrl("/payment/cancel", order))
                .paymentUrl(sepayUrl)
                .expiredAt(now.plusMinutes(15))
                .createdAt(now)
                .updatedAt(now)
                .build());
        return toCheckoutResponse(payment);
    }

    @Transactional
    public boolean handleCallback(String invoice, String status, String transactionId,
                                  Map<String, Object> payload, String signature) {
        if (invoice == null || transactionId == null) {
            throw new BadRequestException("Missing invoice or transaction ID");
        }
        try {
            eventRepository.save(PaymentEvent.builder()
                    .gateway("SEPAY")
                    .orderInvoiceNumber(invoice)
                    .transactionId(transactionId)
                    .eventType(status)
                    .rawPayload(toJson(payload))
                    .signature(signature)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (DuplicateKeyException duplicate) {
            return true;
        }

        EcommercePayment payment = paymentRepository.findByOrderInvoiceNumber(invoice)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + invoice));

        validateCallbackAmount(payment, payload);

        if (sePayIpnParser.isPaid(status)) {
            payment.setStatus(EcommercePaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionId(transactionId);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            orderService.markPaid(payment.getOrderId());
            markEventProcessed(transactionId);
            return true;
        }

        payment.setStatus(EcommercePaymentStatus.FAILED);
        payment.setFailedAt(LocalDateTime.now());
        payment.setTransactionId(transactionId);
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
        orderService.cancel(payment.getOrderId(), "Payment " + status);
        notifyPaymentFailed(payment);
        markEventProcessed(transactionId);
        return true;
    }

    public int expirePendingPayments() {
        List<EcommercePayment> expired = paymentRepository.findByStatusAndExpiredAtBefore(
                EcommercePaymentStatus.PENDING, LocalDateTime.now());
        for (EcommercePayment payment : expired) {
            payment.setStatus(EcommercePaymentStatus.EXPIRED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            orderService.cancel(payment.getOrderId(), "Payment expired");
            notifyPaymentExpired(payment);
        }
        return expired.size();
    }

    public EcommercePayment byOrder(String orderId) {
        return paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new NotFoundException("Payment not found for order: " + orderId));
    }

    public EcommercePayment get(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));
    }

    private void validateCallbackAmount(EcommercePayment payment, Map<String, Object> payload) {
        Double callbackAmount = extractAmount(payload);
        if (callbackAmount == null) {
            throw new BadRequestException("Payment amount missing in callback");
        }
        if (payment.getAmount() == null) {
            throw new BadRequestException("Payment amount not configured");
        }
        if (Math.abs(callbackAmount - payment.getAmount()) > 1.0) {
            throw new BadRequestException("Payment amount mismatch");
        }
    }

    private Double extractAmount(Map<String, Object> payload) {
        Object raw = payload.get("order_amount");
        if (raw == null) {
            raw = payload.get("amount");
        }
        if (raw == null && payload.get("order") instanceof Map<?, ?> order) {
            raw = order.get("order_amount");
            if (raw == null) {
                raw = order.get("amount");
            }
        }
        if (raw == null && payload.get("transaction") instanceof Map<?, ?> transaction) {
            raw = transaction.get("transaction_amount");
            if (raw == null) {
                raw = transaction.get("amount");
            }
        }
        if (raw == null) {
            return null;
        }
        try {
            return Double.parseDouble(String.valueOf(raw).replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void markEventProcessed(String transactionId) {
        eventRepository.findByGatewayAndTransactionId("SEPAY", transactionId).ifPresent(event -> {
            event.setProcessed(true);
            event.setProcessedAt(LocalDateTime.now());
            eventRepository.save(event);
        });
    }

    private void notifyPaymentFailed(EcommercePayment payment) {
        Order order = orderService.get(payment.getOrderId());
        notificationService.create(
                order.getUserId(),
                NotificationType.PAYMENT_FAILED,
                "Thanh toán thất bại",
                "Thanh toán đơn " + payment.getOrderCode() + " không thành công",
                "/orders/" + payment.getOrderId());
        orderMailNotifier.sendPaymentFailed(order);
    }

    private void notifyPaymentExpired(EcommercePayment payment) {
        Order order = orderService.get(payment.getOrderId());
        notificationService.create(
                order.getUserId(),
                NotificationType.PAYMENT_FAILED,
                "Thanh toán hết hạn",
                "Thời gian thanh toán đơn " + payment.getOrderCode() + " đã hết hạn",
                "/orders/" + payment.getOrderId());
        orderMailNotifier.sendPaymentExpired(order);
    }

    public EcommercePayment markRefunded(String orderId) {
        EcommercePayment payment = byOrder(orderId);
        payment.setStatus(EcommercePaymentStatus.REFUNDED);
        payment.setUpdatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    private PaymentCheckoutResponse toCheckoutResponse(EcommercePayment payment) {
        return PaymentCheckoutResponse.builder()
                .paymentId(payment.getPaymentId())
                .orderId(payment.getOrderId())
                .orderInvoiceNumber(payment.getOrderInvoiceNumber())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentUrl(payment.getPaymentUrl())
                .formData(sePayCheckoutSigner.buildSignedFormData(payment))
                .build();
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            return "{}";
        }
    }
}
