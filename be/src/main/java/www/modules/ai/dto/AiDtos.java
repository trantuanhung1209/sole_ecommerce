package www.modules.ai.dto;

import lombok.*;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class AiDtos {
    private AiDtos() {}

    @Data
    public static class AiChatRequest {
        private String conversationId;
        private String message;
        private Map<String, String> context;
    }

    @Data
    @Builder
    public static class SuggestedProduct {
        private String productId;
        private String name;
        private String slug;
        private Double minPrice;
        private String imageUrl;
    }

    @Data
    @Builder
    public static class AiChatResponse {
        private String conversationId;
        private AiRouteType routeType;
        private String answer;
        @Builder.Default
        private List<SuggestedProduct> suggestedProducts = new ArrayList<>();
        @Builder.Default
        private List<String> warnings = new ArrayList<>();
    }
}
