package www.modules.ai.service.context;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import www.modules.common.EcommerceEnums.AiRouteType;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.repository.OrderRepository;
import www.modules.orders.service.OrderService;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class OrderContextProvider {
    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("SO-[A-Z0-9\\-]+", Pattern.CASE_INSENSITIVE);

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public Contribution contribute(String userId, AiRouteType routeType, String message) {
        if (routeType != AiRouteType.ORDER_STATUS && routeType != AiRouteType.PAYMENT_REFUND_POLICY) {
            return Contribution.empty();
        }
        if ("guest".equals(userId)) {
            return new Contribution(
                    "",
                    List.of("Đăng nhập để xem trạng thái đơn hàng của bạn.")
            );
        }

        List<Order> orders = new ArrayList<>();
        Optional<String> orderCode = extractOrderCode(message);
        if (orderCode.isPresent()) {
            orderRepository.findByOrderCode(orderCode.get())
                    .filter(order -> userId.equals(order.getUserId()))
                    .ifPresent(orders::add);
        }
        if (orders.isEmpty()) {
            orders.addAll(orderService.mine(userId, PageRequest.of(0, 3)).getContent());
        }
        if (orders.isEmpty()) {
            return new Contribution(
                    "=== ĐƠN HÀNG CỦA KHÁCH ===\nKhách chưa có đơn hàng nào trong hệ thống.",
                    List.of()
            );
        }

        StringBuilder context = new StringBuilder("=== ĐƠN HÀNG CỦA KHÁCH ===\n");
        for (Order order : orders) {
            context.append(formatOrder(order));
        }
        return new Contribution(context.toString().trim(), List.of());
    }

    private Optional<String> extractOrderCode(String message) {
        if (message == null) {
            return Optional.empty();
        }
        Matcher matcher = ORDER_CODE_PATTERN.matcher(message.toUpperCase());
        if (matcher.find()) {
            return Optional.of(matcher.group().toUpperCase());
        }
        return Optional.empty();
    }

    private String formatOrder(Order order) {
        StringBuilder block = new StringBuilder();
        block.append("- Mã đơn: ").append(order.getOrderCode());
        block.append(" | trạng thái: ").append(order.getStatus());
        block.append(" | thanh toán: ").append(order.getPaymentStatus());
        if (order.getTrackingCode() != null) {
            block.append(" | mã vận đơn: ").append(order.getTrackingCode());
        }
        if (order.getGrandTotal() != null) {
            block.append(" | tổng: ").append(String.format("%,.0f", order.getGrandTotal())).append(" VND");
        }
        if (order.getCreatedAt() != null) {
            block.append(" | tạo lúc: ").append(order.getCreatedAt());
        }
        if (order.getDeliveredAt() != null) {
            block.append(" | giao lúc: ").append(order.getDeliveredAt());
        }
        block.append("\n  sản phẩm:");
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                block.append("\n    • ")
                        .append(item.getProductNameSnapshot())
                        .append(" size ").append(item.getSizeSnapshot());
                if (item.getColorSnapshot() != null) {
                    block.append("/").append(item.getColorSnapshot());
                }
                block.append(" x").append(item.getQuantity());
            }
        }
        block.append("\n");
        return block.toString();
    }

    public record Contribution(String contextText, List<String> warnings) {
        static Contribution empty() {
            return new Contribution("", List.of());
        }
    }
}
