package www.modules.reviews.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;
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

    @Data
    @lombok.Builder
    public static class PublicReviewView {
        private String reviewId;
        private String productId;
        private String productName;
        private String productSlug;
        private String userId;
        private Integer rating;
        private String title;
        private String content;
        private List<String> imageUrls;
        private Integer helpfulCount;
        private Boolean verifiedPurchase;
        private Boolean visible;
        private String staffReply;
        private LocalDateTime createdAt;
    }

    @Data
    @lombok.Builder
    public static class HomeReviewView {
        private String reviewId;
        private String productId;
        private String productName;
        private String productSlug;
        private String userId;
        private Integer rating;
        private String title;
        private String content;
        private Boolean verifiedPurchase;
        private LocalDateTime createdAt;
    }

    @Data
    @lombok.Builder
    public static class HomeReviewsResponse {
        private double averageRating;
        private long totalReviews;
        @lombok.Builder.Default
        private List<HomeReviewView> recent = new ArrayList<>();
    }
}
