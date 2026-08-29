package www.modules.catalog.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.modules.common.EcommerceEnums.GenderTarget;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {
    @Id
    private String productId;
    private String name;
    @Indexed(unique = true)
    private String slug;
    private String description;
    private String shortDescription;
    private String brandId;
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();
    private GenderTarget genderTarget;
    private String material;
    private String careInstruction;
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    @Builder.Default
    private ProductStatus status = ProductStatus.DRAFT;
    @Builder.Default
    private PublicStatus publicStatus = PublicStatus.DRAFT;
    private String createdBy;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    @Builder.Default
    private Boolean deleted = false;
    @Field("created_at")
    private LocalDateTime createdAt;
    @Field("updated_at")
    private LocalDateTime updatedAt;
}
