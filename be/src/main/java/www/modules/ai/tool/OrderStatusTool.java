package www.modules.ai.tool;

import java.util.List;
import java.util.Map;

public final class OrderStatusTool {
    private OrderStatusTool() {}

    public static final ToolDefinition DEFINITION = new ToolDefinition(
            "get_order_status",
            "Lấy trạng thái đơn hàng của người dùng đang đăng nhập. Chỉ dùng khi user đã login.",
            ToolDefinition.objectSchema(Map.of(
                    "orderId", ToolDefinition.stringProp("Mã đơn hàng; để trống để lấy đơn gần nhất")
            ), List.of())
    );
}
