package www.modules.ai.service.context;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.catalog.dto.ProductDtos.ProductSummary;
import www.modules.catalog.dto.ProductDtos.VariantView;
import www.modules.catalog.dto.ProductFilter;
import www.modules.catalog.model.Product;
import www.modules.catalog.service.CatalogService;
import www.modules.common.EcommerceEnums.PublicStatus;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CatalogContextProvider {
    private static final int MAX_PRODUCTS = 5;
    private static final int DESC_LIMIT = 300;

    private final CatalogService catalogService;

    public SearchResult searchByKeyword(String keyword) {
        ProductFilter filter = new ProductFilter();
        filter.setSearch(keyword == null ? "" : keyword.trim());
        filter.setSort("newest");
        filter.setInStock(true);
        var page = catalogService.searchPublished(filter, PageRequest.of(0, MAX_PRODUCTS));
        return formatSummaries(page.getContent());
    }

    public SearchResult searchWithFilters(
            String query,
            String size,
            String color,
            Double minPrice,
            Double maxPrice,
            String category) {
        ProductFilter filter = new ProductFilter();
        filter.setSearch(query == null ? "" : query.trim());
        filter.setSize(size);
        filter.setColor(color);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        if (category != null && !category.isBlank()) {
            filter.setSearch((filter.getSearch() + " " + category).trim());
        }
        filter.setSort("newest");
        filter.setInStock(true);
        var page = catalogService.searchPublished(filter, PageRequest.of(0, MAX_PRODUCTS));
        SearchResult result = formatSummaries(page.getContent());
        if (result.suggestedProducts().isEmpty() && query != null && !query.isBlank()) {
            return searchByKeyword(query);
        }
        return result;
    }

    public SearchResult hydrateByProductIds(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return SearchResult.empty();
        }
        List<ProductSummary> summaries = new ArrayList<>();
        for (String productId : productIds) {
            if (summaries.size() >= MAX_PRODUCTS) {
                break;
            }
            try {
                Product product = catalogService.getProduct(productId);
                if (Boolean.TRUE.equals(product.getDeleted())
                        || product.getPublicStatus() != PublicStatus.PUBLISHED) {
                    continue;
                }
                ProductFilter filter = new ProductFilter();
                filter.setSearch(product.getName());
                filter.setInStock(true);
                catalogService.searchPublished(filter, PageRequest.of(0, 5)).getContent().stream()
                        .filter(summary -> productId.equals(summary.getProductId()))
                        .findFirst()
                        .ifPresent(summaries::add);
            } catch (Exception ignored) {
                // skip missing products
            }
        }
        return formatSummaries(summaries);
    }

    private SearchResult formatSummaries(List<ProductSummary> summaries) {
        if (summaries == null || summaries.isEmpty()) {
            return SearchResult.empty();
        }
        StringBuilder context = new StringBuilder("=== SẢN PHẨM ===\n");
        List<SuggestedProduct> suggested = new ArrayList<>();
        for (ProductSummary summary : summaries) {
            if (summary == null) {
                continue;
            }
            context.append(formatProductBlock(summary));
            suggested.add(toSuggested(summary));
        }
        return new SearchResult(context.toString().trim(), suggested);
    }

    private String formatProductBlock(ProductSummary summary) {
        StringBuilder block = new StringBuilder();
        block.append("- ").append(summary.getName());
        if (summary.getBrandName() != null) {
            block.append(" (").append(summary.getBrandName()).append(")");
        }
        block.append(" | slug: ").append(summary.getSlug());
        if (summary.getMinPrice() != null) {
            block.append(" | giá từ: ").append(String.format("%,.0f", summary.getMinPrice())).append(" VND");
        }
        if (summary.getCompareAtPrice() != null && summary.getCompareAtPrice() > 0) {
            block.append(" | giá gốc: ").append(String.format("%,.0f", summary.getCompareAtPrice())).append(" VND");
        }
        if (summary.getShortDescription() != null) {
            block.append("\n  mô tả: ").append(truncate(summary.getShortDescription()));
        }
        List<VariantView> variants = catalogService.getPublicVariants(summary.getProductId());
        if (!variants.isEmpty()) {
            block.append("\n  biến thể còn hàng: ");
            block.append(variants.stream()
                    .filter(v -> v.getAvailable() != null && v.getAvailable() > 0)
                    .map(v -> v.getSize() + "/" + v.getColorName() + " (" + v.getAvailable() + " sp, "
                            + String.format("%,.0f", v.getPrice()) + " VND)")
                    .limit(8)
                    .reduce((a, b) -> a + "; " + b)
                    .orElse("không có"));
        }
        try {
            Product product = catalogService.getProduct(summary.getProductId());
            if (product.getMaterial() != null && !product.getMaterial().isBlank()) {
                block.append("\n  chất liệu: ").append(truncate(product.getMaterial()));
            }
            if (product.getCareInstruction() != null && !product.getCareInstruction().isBlank()) {
                block.append("\n  bảo quản: ").append(truncate(product.getCareInstruction()));
            }
        } catch (Exception ignored) {
            // optional enrichment
        }
        block.append("\n");
        return block.toString();
    }

    private SuggestedProduct toSuggested(ProductSummary summary) {
        String imageUrl = summary.getImageUrls() != null && !summary.getImageUrls().isEmpty()
                ? summary.getImageUrls().get(0)
                : null;
        return SuggestedProduct.builder()
                .productId(summary.getProductId())
                .name(summary.getName())
                .slug(summary.getSlug())
                .minPrice(summary.getMinPrice())
                .imageUrl(imageUrl)
                .build();
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.replaceAll("\\s+", " ").trim();
        return trimmed.length() <= DESC_LIMIT ? trimmed : trimmed.substring(0, DESC_LIMIT) + "...";
    }

    public record SearchResult(String contextText, List<SuggestedProduct> suggestedProducts) {
        static SearchResult empty() {
            return new SearchResult("", List.of());
        }
    }
}
