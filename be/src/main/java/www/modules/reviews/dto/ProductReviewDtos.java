package www.modules.reviews.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

public final class ProductReviewDtos {
    private ProductReviewDtos() {}

    @Data
    public static class CreateReviewRequest {
        @NotBlank
        private String orderId;
        @NotBlank
        private String orderItemId;
        @Min(1)
        @Max(5)
        private Integer rating;
        private String title;
        @NotBlank
        private String content;
        private List<String> imageUrls = new ArrayList<>();
    }

    @Data
    public static class ReplyReviewRequest {
        @NotBlank
        private String reply;
    }

    @Data
    public static class VisibilityRequest {
        @NotNull
        private Boolean visible;
    }

    @Data
    public static class UpdateReviewRequest {
        @Min(1)
        @Max(5)
        private Integer rating;
        private String title;
        private String content;
        private List<String> imageUrls = new ArrayList<>();
    }
}
