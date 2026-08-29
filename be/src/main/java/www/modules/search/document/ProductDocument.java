package www.modules.search.document;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class ProductDocument {
    private String productId;
    private String name;
    private String slug;
    private String shortDescription;
    private String brandId;
    private String brandName;
    private List<String> categoryIds;
    private String gender;
    private Double minPrice;
    private Double compareAtPrice;
    private Double rating;
    private LocalDateTime publishedAt;
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    @Builder.Default
    private List<VariantDoc> variants = new ArrayList<>();

    @Data
    @Builder
    public static class VariantDoc {
        private String variantId;
        private String sku;
        private String size;
        private String color;
        private Double price;
        private Integer available;
    }
}
