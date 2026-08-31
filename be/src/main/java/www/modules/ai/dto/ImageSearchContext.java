package www.modules.ai.dto;

import lombok.Builder;
import www.modules.ai.dto.AiDtos.SuggestedProduct;

import java.util.List;

@Builder
public record ImageSearchContext(
        VisionAnalysis vision,
        boolean exactMatch,
        List<SuggestedProduct> products,
        String catalogContextText
) {
    public static ImageSearchContext noMatch(VisionAnalysis vision) {
        return ImageSearchContext.builder()
                .vision(vision)
                .exactMatch(false)
                .products(List.of())
                .catalogContextText("")
                .build();
    }
}
