package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.dto.ImageSearchContext;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.service.context.CatalogContextProvider.SearchResult;
import www.modules.catalog.dto.ProductDtos.ProductSummary;
import www.modules.catalog.dto.ProductFilter;
import www.modules.catalog.service.CatalogService;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImageSearchService {

    private final CatalogContextProvider catalogContextProvider;
    private final CatalogService catalogService;

    public ImageSearchContext resolve(VisionAnalysis vision) {
        if (vision == null) {
            return ImageSearchContext.noMatch(VisionAnalysis.builder().description("giày sneaker").build());
        }

        String primaryQuery = vision.primarySearchQuery();
        SearchResult primary = catalogContextProvider.searchWithFilters(primaryQuery, null, null, null, null, null);
        MatchBundle primaryMatches = filterMatches(primary, vision);

        if (!primaryMatches.products().isEmpty()) {
            return ImageSearchContext.builder()
                    .vision(vision)
                    .exactMatch(true)
                    .products(primaryMatches.products())
                    .catalogContextText(primary.contextText())
                    .build();
        }

        if (vision.isBrandIdentified() && hasText(vision.getBrand())) {
            return ImageSearchContext.noMatch(vision);
        }

        if (hasText(vision.getStyle()) || hasText(vision.getColor())) {
            String fallbackQuery = joinNonBlank(vision.getStyle(), vision.getColor(), vision.getCategory());
            SearchResult fallback = catalogContextProvider.searchWithFilters(fallbackQuery, null, null, null, null, null);
            MatchBundle fallbackMatches = filterMatches(fallback, vision);
            if (!fallbackMatches.products().isEmpty()) {
                return ImageSearchContext.builder()
                        .vision(vision)
                        .exactMatch(false)
                        .products(fallbackMatches.products())
                        .catalogContextText(fallback.contextText())
                        .build();
            }
        }

        return ImageSearchContext.noMatch(vision);
    }

    private MatchBundle filterMatches(SearchResult result, VisionAnalysis vision) {
        if (result == null || result.suggestedProducts() == null || result.suggestedProducts().isEmpty()) {
            return new MatchBundle(List.of(), List.of());
        }
        List<String> brandNames = loadBrandNames(result.suggestedProducts());
        List<SuggestedProduct> exact = ImageSearchMatcher.filterExactMatches(
                result.suggestedProducts(), vision, brandNames);
        return new MatchBundle(exact, brandNames);
    }

    private List<String> loadBrandNames(List<SuggestedProduct> products) {
        List<String> brandNames = new ArrayList<>();
        for (SuggestedProduct product : products) {
            brandNames.add(resolveBrandName(product));
        }
        return brandNames;
    }

    private String resolveBrandName(SuggestedProduct product) {
        if (product == null || product.getProductId() == null) {
            return "";
        }
        try {
            ProductFilter filter = new ProductFilter();
            filter.setSearch(product.getName());
            filter.setInStock(true);
            return catalogService.searchPublished(filter, PageRequest.of(0, 5)).getContent().stream()
                    .filter(summary -> product.getProductId().equals(summary.getProductId()))
                    .map(ProductSummary::getBrandName)
                    .findFirst()
                    .orElse("");
        } catch (Exception ex) {
            return "";
        }
    }

    private static String joinNonBlank(String... parts) {
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                if (!builder.isEmpty()) {
                    builder.append(' ');
                }
                builder.append(part.trim());
            }
        }
        return builder.toString();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record MatchBundle(List<SuggestedProduct> products, List<String> brandNames) {}
}
