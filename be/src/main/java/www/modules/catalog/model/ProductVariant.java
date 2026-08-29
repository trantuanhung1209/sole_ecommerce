package www.modules.catalog.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.modules.common.EcommerceEnums.VariantStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "product_variants")
public class ProductVariant {
    @Id
    private String variantId;
    private String productId;
    @Indexed(unique = true)
    private String sku;
    private String size;
    private String colorName;
    private String colorHex;
    private Double price;
    private Double compareAtPrice;
    private Double costPrice;
    private Double weight;
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    @Builder.Default
    private VariantStatus status = VariantStatus.ACTIVE;
    @Field("created_at")
    private LocalDateTime createdAt;
    @Field("updated_at")
    private LocalDateTime updatedAt;
}
