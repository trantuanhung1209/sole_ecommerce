package www.modules.ai.service;

import org.springframework.stereotype.Service;
import www.modules.common.EcommerceEnums.AiRouteType;

@Service
public class AiRouterService {
    public AiRouteType route(String message) {
        String text = message == null ? "" : message.toLowerCase();
        if (text.contains("size") || text.contains("cỡ") || text.contains("co giay")) {
            return AiRouteType.SIZE_ADVICE;
        }
        if (text.contains("đơn") || text.contains("order") || text.contains("giao")) {
            return AiRouteType.ORDER_STATUS;
        }
        if (text.contains("hoàn") || text.contains("đổi") || text.contains("trả")) {
            return AiRouteType.RETURN_POLICY;
        }
        if (text.contains("thanh toán") || text.contains("payment")) {
            return AiRouteType.PAYMENT_REFUND_POLICY;
        }
        if (text.contains("chào") || text.contains("hello") || text.contains("hi")) {
            return AiRouteType.CHITCHAT;
        }
        return AiRouteType.PRODUCT_INFO;
    }
}
