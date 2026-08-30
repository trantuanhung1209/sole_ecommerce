package www.modules.payments;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import www.exception.BadRequestException;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.orders.model.Order;
import www.modules.orders.service.OrderService;
import www.modules.notifications.service.NotificationService;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.model.PaymentEvent;
import www.modules.payments.repository.EcommercePaymentRepository;
import www.modules.payments.repository.PaymentEventRepository;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.payments.service.SePayCheckoutSigner;
import www.modules.payments.service.SePayIpnParser;
import www.config.SePayProperties;
import www.service.implement.OrderMailNotifier;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EcommercePaymentServiceTest {

    @Mock
    private EcommercePaymentRepository paymentRepository;
    @Mock
    private PaymentEventRepository eventRepository;
    @Mock
    private OrderService orderService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private OrderMailNotifier orderMailNotifier;

    @InjectMocks
    private EcommercePaymentService paymentService;

    @BeforeEach
    void setUp() {
        SePayProperties properties = new SePayProperties();
        properties.setMerchantId("MERCHANT_123");
        properties.setSecretKey("test-secret-key");
        SePayCheckoutSigner checkoutSigner = new SePayCheckoutSigner(properties);
        SePayIpnParser ipnParser = new SePayIpnParser();
        paymentService = new EcommercePaymentService(
                paymentRepository,
                eventRepository,
                orderService,
                notificationService,
                orderMailNotifier,
                new ObjectMapper(),
                checkoutSigner,
                ipnParser);
    }

    @Test
    void handleCallback_duplicateTransaction_isIdempotent() {
        EcommercePayment payment = EcommercePayment.builder()
                .paymentId("p1")
                .orderId("o1")
                .orderInvoiceNumber("INV-1")
                .amount(500000.0)
                .status(EcommercePaymentStatus.PENDING)
                .build();

        when(eventRepository.save(any(PaymentEvent.class))).thenThrow(new DuplicateKeyException("dup"));

        boolean result = paymentService.handleCallback(
                "INV-1", "SUCCESS", "tx-1",
                Map.of("order_amount", 500000, "amount", 500000),
                "sig");

        assertTrue(result);
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void handleCallback_amountMismatch_throws() {
        EcommercePayment payment = EcommercePayment.builder()
                .paymentId("p1")
                .orderId("o1")
                .orderInvoiceNumber("INV-1")
                .amount(500000.0)
                .status(EcommercePaymentStatus.PENDING)
                .build();

        when(eventRepository.save(any(PaymentEvent.class))).thenReturn(PaymentEvent.builder().build());
        when(paymentRepository.findByOrderInvoiceNumber("INV-1")).thenReturn(Optional.of(payment));

        assertThrows(BadRequestException.class, () -> paymentService.handleCallback(
                "INV-1", "SUCCESS", "tx-2",
                Map.of("order_amount", 100000),
                null));
    }

    @Test
    void handleCallback_success_marksPaid() {
        EcommercePayment payment = EcommercePayment.builder()
                .paymentId("p1")
                .orderId("o1")
                .orderInvoiceNumber("INV-1")
                .amount(500000.0)
                .status(EcommercePaymentStatus.PENDING)
                .build();

        when(eventRepository.save(any(PaymentEvent.class))).thenReturn(PaymentEvent.builder().build());
        when(paymentRepository.findByOrderInvoiceNumber("INV-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(EcommercePayment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(eventRepository.findByGatewayAndTransactionId(eq("SEPAY"), eq("tx-3")))
                .thenReturn(Optional.of(PaymentEvent.builder().build()));
        when(orderService.markPaid("o1")).thenReturn(Order.builder().orderId("o1").build());

        boolean ok = paymentService.handleCallback(
                "INV-1", "SUCCESS", "tx-3",
                Map.of("order_amount", 500000),
                "sig");

        assertTrue(ok);
        verify(orderService).markPaid("o1");
    }

    @Test
    void handleCallback_nestedPayload_marksPaid() {
        EcommercePayment payment = EcommercePayment.builder()
                .paymentId("p1")
                .orderId("o1")
                .orderInvoiceNumber("ORDER_SO-123_999")
                .amount(500000.0)
                .status(EcommercePaymentStatus.PENDING)
                .build();

        Map<String, Object> payload = Map.of(
                "notification_type", "ORDER_PAID",
                "order", Map.of(
                        "order_invoice_number", "ORDER_SO-123_999",
                        "order_amount", "500000.00"),
                "transaction", Map.of(
                        "transaction_id", "tx-nested",
                        "transaction_status", "APPROVED"));

        when(eventRepository.save(any(PaymentEvent.class))).thenReturn(PaymentEvent.builder().build());
        when(paymentRepository.findByOrderInvoiceNumber("ORDER_SO-123_999")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(EcommercePayment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(eventRepository.findByGatewayAndTransactionId(eq("SEPAY"), eq("tx-nested")))
                .thenReturn(Optional.of(PaymentEvent.builder().build()));
        when(orderService.markPaid("o1")).thenReturn(Order.builder().orderId("o1").build());

        boolean ok = paymentService.handleCallback(
                "ORDER_SO-123_999", "ORDER_PAID", "tx-nested", payload, "sig");

        assertTrue(ok);
        verify(orderService).markPaid("o1");
    }

    @Test
    void expirePendingPayments_cancelsOrders() {
        EcommercePayment pending = EcommercePayment.builder()
                .paymentId("p1")
                .orderId("o1")
                .status(EcommercePaymentStatus.PENDING)
                .expiredAt(LocalDateTime.now().minusMinutes(1))
                .build();

        when(paymentRepository.findByStatusAndExpiredAtBefore(eq(EcommercePaymentStatus.PENDING), any()))
                .thenReturn(java.util.List.of(pending));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(orderService.cancel(eq("o1"), anyString())).thenReturn(Order.builder().orderId("o1").userId("u1").orderCode("ORD-1").build());
        when(orderService.get("o1")).thenReturn(Order.builder().orderId("o1").userId("u1").orderCode("ORD-1").build());

        int count = paymentService.expirePendingPayments();

        assertEquals(1, count);
        verify(orderService).cancel(eq("o1"), eq("Payment expired"));
        verify(orderMailNotifier).sendPaymentExpired(any(Order.class));
    }
}
