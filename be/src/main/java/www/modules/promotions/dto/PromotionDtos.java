package www.modules.promotions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import www.modules.promotions.PromotionEnums.CouponType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class PromotionDtos {
    private PromotionDtos() {}

    @Data
    public static class ValidateCouponRequest {
        @NotBlank
        private String code;
        private double subtotal;
    }

    @Data
    public static class CouponValidationResult {
        private boolean valid;
        private String message;
        private String code;
        private CouponType type;
        private double discountAmount;
        private boolean freeShipping;
    }

    @Data
    public static class UpsertCouponRequest {
        @NotBlank
        private String code;
        @NotNull
        private CouponType type;
        @NotNull
        private Double value;
        private Double minOrderAmount;
        private Double maxDiscount;
        private Integer usageLimit;
        private Integer perUserLimit;
        private List<String> brandIds = new ArrayList<>();
        private List<String> categoryIds = new ArrayList<>();
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private Boolean active;
    }
}
