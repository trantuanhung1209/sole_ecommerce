package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.service.AiRouterService;
import www.modules.common.EcommerceEnums.AiRouteType;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiRouterServiceTest {
    private final AiRouterService router = new AiRouterService();

    @Test
    void route_sizeAdvice() {
        assertEquals(AiRouteType.SIZE_ADVICE, router.route("tư vấn size giày"));
    }

    @Test
    void route_orderStatus() {
        assertEquals(AiRouteType.ORDER_STATUS, router.route("đơn hàng của tôi đang giao chưa"));
    }

    @Test
    void route_returnPolicy() {
        assertEquals(AiRouteType.RETURN_POLICY, router.route("chính sách đổi trả"));
    }

    @Test
    void route_paymentPolicy() {
        assertEquals(AiRouteType.PAYMENT_REFUND_POLICY, router.route("thanh toán sepay"));
    }

    @Test
    void route_productInfoDefault() {
        assertEquals(AiRouteType.PRODUCT_INFO, router.route("giày chạy bộ nam"));
    }
}
