package www.modules.wishlist.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public final class WishlistDtos {
    private WishlistDtos() {}

    @Data
    public static class WishlistRequest {
        @NotBlank
        private String productId;
    }
}
