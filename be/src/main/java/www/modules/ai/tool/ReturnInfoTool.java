package www.modules.ai.tool;

import java.util.List;
import java.util.Map;

public final class ReturnInfoTool {
    private ReturnInfoTool() {}

    public static final ToolDefinition DEFINITION = new ToolDefinition(
            "get_return_info",
            "Tra cứu yêu cầu đổi/trả hiện có và điều kiện đổi trả của user đang đăng nhập. Không tạo yêu cầu mới — hướng user sang /returns.",
            ToolDefinition.objectSchema(Map.of(
                    "orderId", ToolDefinition.stringProp("Mã đơn hàng cần kiểm tra điều kiện đổi trả (tuỳ chọn)")
            ), List.of())
    );
}
