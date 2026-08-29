package www.modules.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import www.modules.common.EcommerceEnums.CartStatus;

public final class CartDtos {
    private CartDtos() {}

    @Data
    public static class AddCartItemRequest {
        @NotBlank
        private String variantId;
        @NotNull
        @Min(1)
        private Integer quantity;
    }

    @Data
    public static class UpdateCartItemRequest {
        @NotNull
        @Min(1)
        private Integer quantity;
    }

    @Data
    public static class CartValidationIssue {
        private String cartItemId;
        private String variantId;
        private String message;
    }

    @Data
    public static class CartValidationResult {
        private boolean valid;
        private List<CartValidationIssue> issues = new ArrayList<>();
    }

    @Data
    public static class CartItemView {
        private String cartItemId;
        private String variantId;
        private Integer quantity;
        private Double priceSnapshot;
        private LocalDateTime addedAt;
        private String productName;
        private String sku;
        private String size;
        private String colorName;
        private String imageUrl;
    }

    @Data
    public static class CartView {
        private String cartId;
        private String userId;
        private String guestSessionId;
        private CartStatus status;
        private List<CartItemView> items = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
