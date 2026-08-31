package www.modules.ai.tool;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record ToolDefinition(String name, String description, Map<String, Object> parameters) {

    public Map<String, Object> toApiMap() {
        Map<String, Object> function = new HashMap<>();
        function.put("name", name);
        function.put("description", description);
        function.put("parameters", parameters);
        return Map.of("type", "function", "function", function);
    }

    public static Map<String, Object> objectSchema(Map<String, Object> properties, List<String> required) {
        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        if (required != null && !required.isEmpty()) {
            schema.put("required", required);
        }
        return schema;
    }

    public static Map<String, Object> stringProp(String description) {
        return Map.of("type", "string", "description", description);
    }

    public static Map<String, Object> numberProp(String description) {
        return Map.of("type", "number", "description", description);
    }
}
