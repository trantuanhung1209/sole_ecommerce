package www.modules.reviews.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "product_reviews")
@CompoundIndex(name = "uniq_review_order_item", def = "{'userId': 1, 'orderId': 1, 'orderItemId': 1}", unique = true)
public class ProductReview {
    @Id
    private String reviewId;
    @Indexed
    private String productId;
    private String variantId;
    @Indexed
    private String userId;
    private String orderId;
    private String orderItemId;
    private Integer rating;
    private String title;
    private String content;
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    @Builder.Default
    private Integer helpfulCount = 0;
    @Builder.Default
    private List<String> votedUserIds = new ArrayList<>();
    private String staffReply;
    private String repliedBy;
    private LocalDateTime repliedAt;
    @Builder.Default
    private Boolean visible = true;
    @Builder.Default
    private Boolean verifiedPurchase = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
