package www.modules.ai.tool;

import java.util.List;
import java.util.Map;

public final class PolicyTool {
    private PolicyTool() {}

    public static final ToolDefinition DEFINITION = new ToolDefinition(
            "get_policy",
            "Lấy nội dung chính sách của shop (đổi trả, thanh toán, vận chuyển, bảo hành).",
            ToolDefinition.objectSchema(Map.of(
                    "topic", Map.of(
                            "type", "string",
                            "description", "Chủ đề chính sách",
                            "enum", List.of("return", "payment", "shipping", "warranty", "order")
                    )
            ), List.of("topic"))
    );
}
