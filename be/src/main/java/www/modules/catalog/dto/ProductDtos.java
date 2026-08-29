package www.modules.catalog.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import www.modules.common.EcommerceEnums.GenderTarget;

import java.util.ArrayList;
import java.util.List;

public final class ProductDtos {
    private ProductDtos() {}

    @Data
    public static class ProductRequest {
        @NotBlank
        private String name;
        private String slug;
        private String description;
        private String shortDescription;
        private String brandId;
        private List<String> categoryIds = new ArrayList<>();
        private GenderTarget genderTarget;
        private String material;
        private String careInstruction;
        private List<String> imageUrls = new ArrayList<>();
    }

    @Data
    public static class VariantRequest {
        @NotBlank
        private String sku;
        @NotBlank
        private String size;
        @NotBlank
        private String colorName;
        private String colorHex;
        @NotNull
        @Min(0)
        private Double price;
        @Min(0)
        private Double compareAtPrice;
        private Double costPrice;
        private Double weight;
        private List<String> imageUrls = new ArrayList<>();
        @Min(0)
        private Integer initialStock = 0;
    }

    @Data
    public static class BrandRequest {
        @NotBlank
        private String name;
        private String slug;
        private String description;
    }

    @Data
    public static class CategoryRequest {
        @NotBlank
        private String name;
        private String slug;
        private String description;
        private String parentId;
    }

    @Data
    public static class RejectProductRequest {
        private String reason;
    }

    @Data
    @lombok.Builder
    public static class ProductSummary {
        private String productId;
        private String name;
        private String slug;
        private String shortDescription;
        private String brandId;
        private String brandName;
        private List<String> categoryIds;
        private String genderTarget;
        private List<String> imageUrls;
        private Double minPrice;
        private Double compareAtPrice;
        private String status;
        private String publicStatus;
    }

    @Data
    @lombok.Builder
    public static class VariantView {
        private String variantId;
        private String productId;
        private String sku;
        private String size;
        private String colorName;
        private String colorHex;
        private Double price;
        private Double compareAtPrice;
        private List<String> imageUrls;
        private String status;
        private Integer onHand;
        private Integer reserved;
        private Integer available;
    }
}
