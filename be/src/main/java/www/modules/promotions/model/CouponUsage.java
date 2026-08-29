package www.modules.promotions.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupon_usages")
public class CouponUsage {
    @Id
    private String usageId;
    private String couponId;
    private String code;
    private String userId;
    private String orderId;
    private Double discountApplied;
    private LocalDateTime usedAt;
}
