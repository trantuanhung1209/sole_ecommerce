package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import www.modules.ai.service.context.OrderContextProvider;
import www.modules.common.EcommerceEnums.AiRouteType;
import www.modules.orders.model.Order;
import www.modules.orders.repository.OrderRepository;
import www.modules.orders.service.OrderService;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderContextProviderTest {
    @Mock private OrderService orderService;
    @Mock private OrderRepository orderRepository;

    @InjectMocks
    private OrderContextProvider orderContextProvider;

    @Test
    void guestOrderStatus_addsLoginWarning() {
        var contribution = orderContextProvider.contribute("guest", AiRouteType.ORDER_STATUS, "đơn hàng");
        assertTrue(contribution.warnings().stream().anyMatch(w -> w.contains("Đăng nhập")));
    }

    @Test
    void authenticatedUser_includesRecentOrders() {
        Order order = Order.builder()
                .orderCode("SO-123")
                .userId("u1")
                .status(www.modules.common.EcommerceEnums.OrderStatus.SHIPPED)
                .paymentStatus(www.modules.common.EcommerceEnums.EcommercePaymentStatus.COMPLETED)
                .build();
        when(orderService.mine("u1", PageRequest.of(0, 3))).thenReturn(new PageImpl<>(List.of(order)));

        var contribution = orderContextProvider.contribute("u1", AiRouteType.ORDER_STATUS, "xem đơn");

        assertTrue(contribution.contextText().contains("SO-123"));
    }

    @Test
    void orderCodeInMessage_looksUpOwnedOrder() {
        Order order = Order.builder()
                .orderCode("SO-999")
                .userId("u1")
                .status(www.modules.common.EcommerceEnums.OrderStatus.DELIVERED)
                .build();
        when(orderRepository.findByOrderCode("SO-999")).thenReturn(Optional.of(order));

        var contribution = orderContextProvider.contribute("u1", AiRouteType.ORDER_STATUS, "SO-999 đang ở đâu");

        assertTrue(contribution.contextText().contains("SO-999"));
    }
}
