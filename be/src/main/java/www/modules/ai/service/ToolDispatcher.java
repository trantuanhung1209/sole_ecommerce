package www.modules.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.service.context.PolicyKnowledge;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.orders.model.Order;
import www.modules.orders.repository.OrderRepository;
import www.modules.orders.service.OrderService;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.service.ReturnRefundPolicy;
import www.modules.returns.service.ReturnService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToolDispatcher {

    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("SO-[A-Z0-9\\-]+", Pattern.CASE_INSENSITIVE);

    private final CatalogContextProvider catalogContextProvider;
    private final PolicyKnowledge policyKnowledge;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ReturnService returnService;
    private final ObjectMapper objectMapper;

    public Object dispatch(String toolName, String argumentsJson, String userId) {
        Map<String, Object> args = parseArgs(argumentsJson);
        return switch (toolName) {
            case "search_catalog" -> searchCatalog(args);
            case "get_policy" -> getPolicy(args);
            case "get_order_status" -> {
                requireLogin(userId);
                yield getOrderStatus(userId, args);
            }
            case "get_return_info" -> {
                requireLogin(userId);
                yield getReturnInfo(userId, args);
            }
            default -> throw new IllegalArgumentException("Unknown tool: " + toolName);
        };
    }

    private Map<String, Object> searchCatalog(Map<String, Object> args) {
        String query = stringArg(args, "query");
        CatalogContextProvider.SearchResult result = catalogContextProvider.searchWithFilters(
                query,
                stringArg(args, "size"),
                stringArg(args, "color"),
                doubleArg(args, "minPrice"),
                doubleArg(args, "maxPrice"),
                stringArg(args, "category")
        );
        Map<String, Object> response = new HashMap<>();
        response.put("contextText", result.contextText());
        response.put("suggestedProducts", result.suggestedProducts());
        response.put("count", result.suggestedProducts().size());
        return response;
    }

    private Map<String, Object> getPolicy(Map<String, Object> args) {
        String topic = stringArg(args, "topic");
        if (topic == null || topic.isBlank()) {
            topic = "order";
        }
        return Map.of("policy", policyKnowledge.getPolicyForTool(topic));
    }

    private Map<String, Object> getOrderStatus(String userId, Map<String, Object> args) {
        List<Order> orders = new ArrayList<>();
        String orderId = stringArg(args, "orderId");
        if (orderId != null && !orderId.isBlank()) {
            resolveOrder(userId, orderId).ifPresent(orders::add);
        }
        if (orders.isEmpty()) {
            orders.addAll(orderService.mine(userId, PageRequest.of(0, 3)).getContent());
        }

        Map<String, Object> response = new HashMap<>();
        if (orders.isEmpty()) {
            response.put("orders", List.of());
            response.put("message", "Khách chưa có đơn hàng nào trong hệ thống.");
            return response;
        }

        List<Map<String, Object>> orderViews = orders.stream().map(this::toOrderView).toList();
        response.put("orders", orderViews);
        return response;
    }

    private Map<String, Object> getReturnInfo(String userId, Map<String, Object> args) {
        Map<String, Object> response = new HashMap<>();
        List<ReturnRequest> returns = returnService.mine(userId, PageRequest.of(0, 5)).getContent();
        response.put("existingReturns", returns.stream().map(r -> Map.of(
                "returnId", r.getReturnId(),
                "orderId", r.getOrderId(),
                "status", String.valueOf(r.getStatus()),
                "reason", r.getReason() != null ? r.getReason() : ""
        )).toList());

        String orderId = stringArg(args, "orderId");
        List<Map<String, Object>> eligibility = new ArrayList<>();
        if (orderId != null && !orderId.isBlank()) {
            resolveOrder(userId, orderId).ifPresent(order -> eligibility.add(buildEligibility(order)));
        } else {
            orderService.mine(userId, PageRequest.of(0, 3)).getContent().stream()
                    .map(this::buildEligibility)
                    .forEach(eligibility::add);
        }
        response.put("eligibility", eligibility);
        response.put("returnWindowDays", ReturnRefundPolicy.RETURN_WINDOW_DAYS);
        response.put("action", "Để tạo yêu cầu đổi/trả, vui lòng truy cập /returns trên website.");
        return response;
    }

    private Map<String, Object> buildEligibility(Order order) {
        Map<String, Object> info = new HashMap<>();
        info.put("orderCode", order.getOrderCode());
        info.put("orderId", order.getOrderId());
        info.put("status", String.valueOf(order.getStatus()));
        boolean delivered = order.getStatus() == OrderStatus.DELIVERED
                || order.getStatus() == OrderStatus.COMPLETED
                || order.getStatus() == OrderStatus.RETURN_REQUESTED;
        info.put("delivered", delivered);
        boolean withinWindow = false;
        if (order.getDeliveredAt() != null) {
            LocalDateTime deadline = order.getDeliveredAt().plusDays(ReturnRefundPolicy.RETURN_WINDOW_DAYS);
            withinWindow = LocalDateTime.now().isBefore(deadline);
            info.put("returnDeadline", deadline.toString());
        }
        info.put("eligible", delivered && withinWindow);
        if (!delivered) {
            info.put("reason", "Chỉ đơn đã giao mới được đổi/trả.");
        } else if (!withinWindow) {
            info.put("reason", "Đã quá thời hạn " + ReturnRefundPolicy.RETURN_WINDOW_DAYS + " ngày kể từ ngày giao.");
        }
        return info;
    }

    private Map<String, Object> toOrderView(Order order) {
        Map<String, Object> view = new HashMap<>();
        view.put("orderCode", order.getOrderCode());
        view.put("orderId", order.getOrderId());
        view.put("status", String.valueOf(order.getStatus()));
        view.put("paymentStatus", String.valueOf(order.getPaymentStatus()));
        if (order.getTrackingCode() != null) {
            view.put("trackingCode", order.getTrackingCode());
        }
        if (order.getGrandTotal() != null) {
            view.put("grandTotal", order.getGrandTotal());
        }
        if (order.getCreatedAt() != null) {
            view.put("createdAt", order.getCreatedAt().toString());
        }
        if (order.getDeliveredAt() != null) {
            view.put("deliveredAt", order.getDeliveredAt().toString());
        }
        if (order.getItems() != null) {
            view.put("items", order.getItems().stream().map(item -> Map.of(
                    "productName", item.getProductNameSnapshot(),
                    "size", item.getSizeSnapshot() != null ? item.getSizeSnapshot() : "",
                    "quantity", item.getQuantity()
            )).toList());
        }
        return view;
    }

    private Optional<Order> resolveOrder(String userId, String orderRef) {
        if (orderRef == null || orderRef.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = ORDER_CODE_PATTERN.matcher(orderRef.toUpperCase());
        if (matcher.find()) {
            return orderRepository.findByOrderCode(matcher.group())
                    .filter(order -> userId.equals(order.getUserId()));
        }
        return orderRepository.findById(orderRef)
                .filter(order -> userId.equals(order.getUserId()));
    }

    private void requireLogin(String userId) {
        if (userId == null || userId.isBlank() || "guest".equals(userId)) {
            throw new AccessDeniedException("Yêu cầu đăng nhập để sử dụng tool này");
        }
    }

    private Map<String, Object> parseArgs(String argumentsJson) {
        try {
            if (argumentsJson == null || argumentsJson.isBlank()) {
                return Map.of();
            }
            return objectMapper.readValue(argumentsJson, new TypeReference<>() {});
        } catch (Exception ex) {
            log.warn("Failed to parse tool arguments: {}", argumentsJson);
            return Map.of();
        }
    }

    private String stringArg(Map<String, Object> args, String key) {
        Object value = args.get(key);
        return value == null ? null : value.toString();
    }

    private Double doubleArg(Map<String, Object> args, String key) {
        Object value = args.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<SuggestedProduct> extractSuggestedProducts(List<Object> toolResults) {
        List<SuggestedProduct> products = new ArrayList<>();
        for (Object result : toolResults) {
            if (result instanceof Map<?, ?> map && map.get("suggestedProducts") instanceof List<?> list) {
                for (Object item : list) {
                    if (item instanceof SuggestedProduct product) {
                        products.add(product);
                    }
                }
            }
        }
        return products;
    }
}
