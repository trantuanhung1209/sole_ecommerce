package www.modules.ai.tool;

import java.util.List;
import java.util.Map;

public final class CatalogSearchTool {
    private CatalogSearchTool() {}

    public static final ToolDefinition DEFINITION = new ToolDefinition(
            "search_catalog",
            "Tìm kiếm sản phẩm giày trong catalog theo từ khóa và bộ lọc (size, màu, giá, thương hiệu).",
            ToolDefinition.objectSchema(Map.of(
                    "query", ToolDefinition.stringProp("Từ khóa tìm kiếm, ví dụ: 'giày chạy bộ Nike'"),
                    "size", ToolDefinition.stringProp("Size giày, ví dụ: '42'"),
                    "color", ToolDefinition.stringProp("Màu sắc"),
                    "minPrice", ToolDefinition.numberProp("Giá tối thiểu (VND)"),
                    "maxPrice", ToolDefinition.numberProp("Giá tối đa (VND)"),
                    "category", ToolDefinition.stringProp("Loại giày: sneaker, running, boot...")
            ), List.of("query"))
    );
}
