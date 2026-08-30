package www.modules.returns;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.exception.BadRequestException;
import www.modules.common.EcommerceEnums.RefundMethod;
import www.modules.common.EcommerceEnums.ReturnItemCondition;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.inventory.service.InventoryService;
import www.modules.notifications.service.NotificationService;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.repository.OrderRepository;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.returns.dto.ReturnDtos.ConfirmRefundRequest;
import www.modules.returns.dto.ReturnDtos.MarkReceivedRequest;
import www.modules.returns.dto.ReturnDtos.UpdateReturnStatusRequest;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.repository.ReturnRequestRepository;
import www.modules.returns.service.ReturnService;
import www.service.implement.OrderMailNotifier;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReturnServiceTest {

    @Mock
    private ReturnRequestRepository returnRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderMailNotifier orderMailNotifier;
    @Mock
    private NotificationService notificationService;
    @Mock
    private EcommercePaymentService paymentService;
    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private ReturnService returnService;

    private Order order;
    private ReturnRequest returnRequest;

    @BeforeEach
    void setUp() {
        OrderItem orderItem = OrderItem.builder()
                .orderItemId("oi1")
                .variantId("v1")
                .quantity(1)
                .lineTotal(500_000.0)
                .build();
        order = Order.builder()
                .orderId("o1")
                .orderCode("SO-001")
                .userId("u1")
                .items(new ArrayList<>(java.util.List.of(orderItem)))
                .build();
        returnRequest = ReturnRequest.builder()
                .returnId("r1")
                .orderId("o1")
                .orderItemId("oi1")
                .userId("u1")
                .status(ReturnStatus.PENDING)
                .refundAmount(500_000.0)
                .build();
    }

    @Test
    void updateStatus_blocksReceivedViaGenericApi() {
        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.RECEIVED);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> returnService.updateStatus("r1", request));
        assertTrue(ex.getMessage().contains("mark-received"));
        verify(returnRepository, never()).save(any());
    }

    @Test
    void updateStatus_blocksRefundPendingViaGenericApi() {
        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.REFUND_PENDING);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> returnService.updateStatus("r1", request));
        assertTrue(ex.getMessage().contains("request-refund"));
    }

    @Test
    void updateStatus_rejectsInvalidTransition() {
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));

        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.APPROVED);

        assertThrows(BadRequestException.class, () -> returnService.updateStatus("r1", request));
    }

    @Test
    void updateStatus_rejectRequiresMinReasonLength() {
        returnRequest.setStatus(ReturnStatus.PENDING);
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));

        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.REJECTED);
        request.setRejectedReason("ngắn");

        assertThrows(BadRequestException.class, () -> returnService.updateStatus("r1", request));
    }

    @Test
    void updateStatus_happyPathThroughStaffConfirmedAndApproved() {
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateReturnStatusRequest confirm = new UpdateReturnStatusRequest();
        confirm.setStatus(ReturnStatus.STAFF_CONFIRMED);
        ReturnRequest staffConfirmed = returnService.updateStatus("r1", confirm);
        assertEquals(ReturnStatus.STAFF_CONFIRMED, staffConfirmed.getStatus());

        returnRequest.setStatus(ReturnStatus.STAFF_CONFIRMED);
        UpdateReturnStatusRequest approve = new UpdateReturnStatusRequest();
        approve.setStatus(ReturnStatus.APPROVED);
        ReturnRequest approved = returnService.updateStatus("r1", approve);
        assertEquals(ReturnStatus.APPROVED, approved.getStatus());
        assertNotNull(approved.getShipBackDeadlineAt());
        verify(orderMailNotifier).sendReturnApproved(eq(order), any(ReturnRequest.class));
    }

    @Test
    void markReceived_damagedSetsMaxRefundAndSkipsRestock() {
        returnRequest.setStatus(ReturnStatus.APPROVED);
        returnRequest.setShipBackDeadlineAt(LocalDateTime.now().plusDays(3));
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        MarkReceivedRequest body = new MarkReceivedRequest();
        body.setItemCondition(ReturnItemCondition.DAMAGED);
        body.setReceiveNote("Móp mũi giày, không đủ hộp");

        ReturnRequest received = returnService.markReceived("r1", body);

        assertEquals(ReturnStatus.RECEIVED, received.getStatus());
        assertEquals(250_000.0, received.getMaxRefundAmount());
        assertEquals(ReturnItemCondition.DAMAGED, received.getItemCondition());
        verify(inventoryService, never()).restock(anyString(), anyInt());
    }

    @Test
    void markReceived_goodRestocksInventory() {
        returnRequest.setStatus(ReturnStatus.APPROVED);
        returnRequest.setShipBackDeadlineAt(LocalDateTime.now().plusDays(3));
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        MarkReceivedRequest body = new MarkReceivedRequest();
        body.setItemCondition(ReturnItemCondition.GOOD);

        ReturnRequest received = returnService.markReceived("r1", body);

        assertEquals(500_000.0, received.getMaxRefundAmount());
        verify(inventoryService).restock("v1", 1);
    }

    @Test
    void markReceived_damagedWithoutNoteRejected() {
        MarkReceivedRequest body = new MarkReceivedRequest();
        body.setItemCondition(ReturnItemCondition.DAMAGED);

        assertThrows(BadRequestException.class, () -> returnService.markReceived("r1", body));
    }

    @Test
    void requestRefund_movesToRefundPending() {
        returnRequest.setStatus(ReturnStatus.RECEIVED);
        returnRequest.setMaxRefundAmount(500_000.0);
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        ReturnRequest pending = returnService.requestRefund("r1", "mgr1", null);

        assertEquals(ReturnStatus.REFUND_PENDING, pending.getStatus());
        verify(paymentService).markRefundPending("o1");
        verify(notificationService).create(eq("u1"), any(), anyString(), anyString(), eq("/returns"));
    }

    @Test
    void confirmRefund_rejectsAmountAboveCap() {
        returnRequest.setStatus(ReturnStatus.REFUND_PENDING);
        returnRequest.setMaxRefundAmount(250_000.0);
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(paymentService.byOrder("o1")).thenReturn(EcommercePayment.builder().orderId("o1").amount(500_000.0).build());

        ConfirmRefundRequest body = new ConfirmRefundRequest();
        body.setAmount(300_000.0);
        body.setTransactionRef("FT123456");
        body.setMethod(RefundMethod.BANK_TRANSFER);

        assertThrows(BadRequestException.class, () -> returnService.confirmRefund("r1", "mgr1", body));
    }

    @Test
    void confirmRefund_completesWhenAmountWithinCap() {
        returnRequest.setStatus(ReturnStatus.REFUND_PENDING);
        returnRequest.setMaxRefundAmount(250_000.0);
        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentService.byOrder("o1")).thenReturn(EcommercePayment.builder().orderId("o1").amount(500_000.0).build());

        ConfirmRefundRequest body = new ConfirmRefundRequest();
        body.setAmount(250_000.0);
        body.setTransactionRef("FT123456");
        body.setMethod(RefundMethod.BANK_TRANSFER);

        ReturnRequest refunded = returnService.confirmRefund("r1", "mgr1", body);

        assertEquals(ReturnStatus.REFUNDED, refunded.getStatus());
        assertEquals(250_000.0, refunded.getRefundAmount());
        verify(paymentService).markRefundCompleted(eq("o1"), eq(250_000.0), eq(RefundMethod.BANK_TRANSFER), eq("FT123456"), isNull(), isNull());
    }
}
