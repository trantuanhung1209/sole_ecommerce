package www.modules.promotions.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import www.modules.promotions.PromotionEnums.CouponType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupons")
public class Coupon {
    @Id
    private String couponId;
    @Indexed(unique = true)
    private String code;
    private CouponType type;
    private Double value;
    @Builder.Default
    private Double minOrderAmount = 0.0;
    private Double maxDiscount;
    @Builder.Default
    private Integer usageLimit = null;
    @Builder.Default
    private Integer usedCount = 0;
    @Builder.Default
    private Integer perUserLimit = 1;
    @Builder.Default
    private List<String> brandIds = new ArrayList<>();
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    @Builder.Default
    private Boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
