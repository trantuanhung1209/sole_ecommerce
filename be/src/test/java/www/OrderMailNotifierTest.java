package www;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.model.entity.User;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.service.OrderService;
import www.modules.returns.dto.ReturnDtos.UpdateReturnStatusRequest;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.repository.ReturnRequestRepository;
import www.modules.returns.service.ReturnService;
import www.repository.UserRepository;
import www.service.implement.OrderMailNotifier;
import www.service.interfaces.MailService;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderMailNotifierTest {

    @Mock
    private MailService mailService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderMailNotifier orderMailNotifier;

    @Test
    void sendOrderConfirmation_resolvesUserAndSendsMail() {
        Order order = Order.builder()
                .orderId("o1")
                .orderCode("SO-001")
                .userId("u1")
                .grandTotal(500000.0)
                .items(List.of())
                .build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(
                User.builder().userId("u1").email("buyer@test.com").fullName("Buyer").build()
        ));

        orderMailNotifier.sendOrderConfirmation(order);

        verify(mailService).sendOrderConfirmationMail(eq("buyer@test.com"), eq("Buyer"), eq(order));
    }

    @Test
    void sendOrderConfirmation_skipsWhenUserMissing() {
        Order order = Order.builder().orderId("o1").userId("missing").build();
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        orderMailNotifier.sendOrderConfirmation(order);

        verifyNoInteractions(mailService);
    }
}

@ExtendWith(MockitoExtension.class)
class OrderServiceMailIntegrationTest {

    @Mock
    private www.modules.orders.repository.OrderRepository orderRepository;
    @Mock
    private www.modules.inventory.service.InventoryService inventoryService;
    @Mock
    private OrderMailNotifier orderMailNotifier;
    @Mock
    private www.modules.notifications.service.NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void markPaid_sendsConfirmationEmail() {
        Order order = Order.builder()
                .orderId("o1")
                .orderCode("SO-001")
                .userId("u1")
                .build();
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.markPaid("o1");

        verify(orderMailNotifier).sendOrderConfirmation(any(Order.class));
    }

    @Test
    void updateStatusToShipped_sendsShippedEmail() {
        Order order = Order.builder()
                .orderId("o1")
                .status(OrderStatus.PROCESSING)
                .build();
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateStatus("o1", OrderStatus.SHIPPED);

        verify(orderMailNotifier).sendOrderShipped(any(Order.class));
    }
}

@ExtendWith(MockitoExtension.class)
class ReturnServiceMailIntegrationTest {

    @Mock
    private ReturnRequestRepository returnRepository;
    @Mock
    private www.modules.orders.repository.OrderRepository orderRepository;
    @Mock
    private OrderMailNotifier orderMailNotifier;
    @Mock
    private www.modules.notifications.service.NotificationService notificationService;

    @InjectMocks
    private ReturnService returnService;

    @Test
    void updateStatusApproved_sendsReturnApprovedEmail() {
        ReturnRequest returnRequest = ReturnRequest.builder()
                .returnId("r1")
                .orderId("o1")
                .orderItemId("oi1")
                .status(ReturnStatus.STAFF_CONFIRMED)
                .refundAmount(100000.0)
                .build();
        Order order = Order.builder()
                .orderId("o1")
                .orderCode("SO-001")
                .userId("u1")
                .items(new java.util.ArrayList<>(java.util.List.of(
                        OrderItem.builder().orderItemId("oi1").build())))
                .build();

        when(returnRepository.findById("r1")).thenReturn(Optional.of(returnRequest));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.APPROVED);

        returnService.updateStatus("r1", request);

        verify(orderMailNotifier).sendReturnApproved(eq(order), any(ReturnRequest.class));
    }
}
