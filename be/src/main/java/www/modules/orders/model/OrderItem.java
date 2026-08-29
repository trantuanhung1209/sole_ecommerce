package www.modules.orders.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    private String orderItemId;
    private String productId;
    private String variantId;
    private String skuSnapshot;
    private String productNameSnapshot;
    private String brandNameSnapshot;
    private String sizeSnapshot;
    private String colorSnapshot;
    private String imageSnapshot;
    private Double unitPrice;
    private Integer quantity;
    @Builder.Default
    private Double discountAmount = 0.0;
    private Double lineTotal;
    @Builder.Default
    private Boolean reviewed = false;
    private String returnStatus;
}
