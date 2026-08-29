package www.modules.ai.service.context;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import www.modules.common.EcommerceEnums.AiRouteType;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.service.ReturnService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ReturnContextProvider {
    private final ReturnService returnService;

    public OrderContextProvider.Contribution contribute(String userId, AiRouteType routeType) {
        if (routeType != AiRouteType.RETURN_POLICY && routeType != AiRouteType.ORDER_STATUS) {
            return OrderContextProvider.Contribution.empty();
        }
        if ("guest".equals(userId)) {
            if (routeType == AiRouteType.RETURN_POLICY) {
                return OrderContextProvider.Contribution.empty();
            }
            return OrderContextProvider.Contribution.empty();
        }

        List<ReturnRequest> returns = returnService.mine(userId, PageRequest.of(0, 5)).getContent();
        if (returns.isEmpty()) {
            return new OrderContextProvider.Contribution(
                    "=== YÊU CẦU ĐỔI/TRẢ ===\nKhách chưa có yêu cầu đổi/trả nào.",
                    List.of()
            );
        }

        StringBuilder context = new StringBuilder("=== YÊU CẦU ĐỔI/TRẢ ===\n");
        for (ReturnRequest request : returns) {
            context.append("- returnId: ").append(request.getReturnId());
            context.append(" | orderId: ").append(request.getOrderId());
            context.append(" | trạng thái: ").append(request.getStatus());
            if (request.getRefundAmount() != null) {
                context.append(" | hoàn: ").append(String.format("%,.0f", request.getRefundAmount())).append(" VND");
            }
            if (request.getReason() != null) {
                context.append(" | lý do: ").append(request.getReason());
            }
            context.append("\n");
        }
        return new OrderContextProvider.Contribution(context.toString().trim(), List.of());
    }
}
