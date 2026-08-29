package www.modules.search.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import www.exception.NotFoundException;
import www.modules.catalog.model.Brand;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.BrandRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.VariantStatus;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.repository.InventoryRepository;
import www.modules.reviews.repository.ProductReviewRepository;
import www.modules.search.document.ProductDocument;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductIndexMapper {

    private final ProductVariantRepository variantRepository;
    private final BrandRepository brandRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductReviewRepository reviewRepository;

    public ProductDocument toDocument(Product product) {
        List<ProductVariant> variants = variantRepository.findByProductId(product.getProductId()).stream()
                .filter(v -> v.getStatus() == null || v.getStatus() == VariantStatus.ACTIVE)
                .toList();
        double minPrice = variants.stream().mapToDouble(ProductVariant::getPrice).min().orElse(0);
        Double compareAt = variants.stream()
                .map(ProductVariant::getCompareAtPrice)
                .filter(p -> p != null && p > 0)
                .min(Double::compare)
                .orElse(null);
        double rating = reviewRepository.findByProductIdAndVisibleTrue(product.getProductId()).stream()
                .mapToInt(r -> r.getRating() != null ? r.getRating() : 0)
                .average()
                .orElse(0);

        String brandName = null;
        if (product.getBrandId() != null) {
            brandName = brandRepository.findById(product.getBrandId()).map(Brand::getName).orElse(null);
        }

        List<ProductDocument.VariantDoc> variantDocs = variants.stream().map(v -> {
            int available = 0;
            try {
                Inventory inv = inventoryRepository.findByVariantIdAndWarehouseId(v.getVariantId(), "default")
                        .orElseThrow(() -> new NotFoundException("missing"));
                available = inv.getAvailable() != null ? inv.getAvailable() : 0;
            } catch (NotFoundException ignored) {
            }
            return ProductDocument.VariantDoc.builder()
                    .variantId(v.getVariantId())
                    .sku(v.getSku())
                    .size(v.getSize())
                    .color(v.getColorName())
                    .price(v.getPrice())
                    .available(available)
                    .build();
        }).toList();

        return ProductDocument.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .slug(product.getSlug())
                .shortDescription(product.getShortDescription())
                .brandId(product.getBrandId())
                .brandName(brandName)
                .categoryIds(product.getCategoryIds())
                .gender(product.getGenderTarget() != null ? product.getGenderTarget().name() : null)
                .minPrice(minPrice)
                .compareAtPrice(compareAt)
                .rating(rating)
                .publishedAt(product.getUpdatedAt())
                .imageUrls(product.getImageUrls() != null ? product.getImageUrls() : List.of())
                .variants(variantDocs)
                .build();
    }
}
