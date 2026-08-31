package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import www.modules.ai.service.ToolDispatcher;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.service.context.PolicyKnowledge;
import www.modules.orders.repository.OrderRepository;
import www.modules.orders.service.OrderService;
import www.modules.returns.service.ReturnService;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class ToolDispatcherTest {

    @Mock private CatalogContextProvider catalogContextProvider;
    @Mock private PolicyKnowledge policyKnowledge;
    @Mock private OrderService orderService;
    @Mock private OrderRepository orderRepository;
    @Mock private ReturnService returnService;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private ToolDispatcher toolDispatcher;

    @Test
    void guestCallingGetOrderStatusThrowsAccessDenied() {
        assertThrows(AccessDeniedException.class, () ->
                toolDispatcher.dispatch("get_order_status", "{}", null));
    }

    @Test
    void guestCallingGetReturnInfoThrowsAccessDenied() {
        assertThrows(AccessDeniedException.class, () ->
                toolDispatcher.dispatch("get_return_info", "{}", "guest"));
    }
}
