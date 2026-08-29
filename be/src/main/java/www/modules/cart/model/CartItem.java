package www.modules.cart.model;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    @Builder.Default
    private String cartItemId = UUID.randomUUID().toString();
    private String variantId;
    private Integer quantity;
    private Double priceSnapshot;
    private LocalDateTime addedAt;
}
