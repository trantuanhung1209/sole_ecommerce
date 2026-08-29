package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.model.AiEmbedding;
import www.modules.ai.model.AiEntityType;
import www.modules.ai.repository.AiEmbeddingRepository;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.util.VectorUtils;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRetrievalService {
    private final OpenAiEmbeddingAdapter embeddingAdapter;
    private final AiEmbeddingRepository embeddingRepository;
    private final CatalogContextProvider catalogContextProvider;

    @Value("${ai.retrieval.product-top-k:5}")
    private int productTopK = 5;

    @Value("${ai.retrieval.policy-top-k:2}")
    private int policyTopK = 2;

    public RetrievalResult retrieve(String message, AiRouteType routeType) {
        if (!embeddingAdapter.isConfigured()) {
            return fallbackKeywordSearch(message);
        }

        List<Double> queryEmbedding = embeddingAdapter.embed(message);
        if (queryEmbedding.isEmpty()) {
            return fallbackKeywordSearch(message);
        }

        List<ScoredEmbedding> scored = embeddingRepository.findAll().stream()
                .filter(doc -> doc.getEmbedding() != null && !doc.getEmbedding().isEmpty())
                .map(doc -> new ScoredEmbedding(doc, VectorUtils.cosineSimilarity(queryEmbedding, doc.getEmbedding())))
                .sorted(Comparator.comparingDouble(ScoredEmbedding::score).reversed())
                .toList();

        int productLimit = isProductHeavy(routeType) ? productTopK : Math.min(2, productTopK);
        int policyLimit = isPolicyHeavy(routeType) ? policyTopK : (routeType == AiRouteType.CHITCHAT ? 0 : 1);

        List<String> productIds = scored.stream()
                .filter(s -> s.doc().getEntityType() == AiEntityType.PRODUCT)
                .limit(productLimit)
                .map(s -> s.doc().getEntityId())
                .toList();

        List<String> policyTexts = scored.stream()
                .filter(s -> s.doc().getEntityType() == AiEntityType.POLICY)
                .limit(policyLimit)
                .map(s -> s.doc().getText())
                .toList();

        CatalogContextProvider.SearchResult catalog = productIds.isEmpty()
                ? catalogContextProvider.searchByKeyword(message)
                : catalogContextProvider.hydrateByProductIds(productIds);

        if (catalog.suggestedProducts().isEmpty()) {
            catalog = catalogContextProvider.searchByKeyword(message);
        }

        StringBuilder context = new StringBuilder();
        if (!policyTexts.isEmpty()) {
            context.append("=== CHÍNH SÁCH LIÊN QUAN (retrieval) ===\n");
            policyTexts.forEach(text -> context.append(text).append("\n\n"));
        }
        if (!catalog.contextText().isBlank()) {
            context.append(catalog.contextText());
        }

        return new RetrievalResult(context.toString().trim(), catalog.suggestedProducts());
    }

    private RetrievalResult fallbackKeywordSearch(String message) {
        CatalogContextProvider.SearchResult catalog = catalogContextProvider.searchByKeyword(message);
        return new RetrievalResult(catalog.contextText(), catalog.suggestedProducts());
    }

    private static boolean isProductHeavy(AiRouteType routeType) {
        return routeType == AiRouteType.PRODUCT_INFO || routeType == AiRouteType.SIZE_ADVICE;
    }

    private static boolean isPolicyHeavy(AiRouteType routeType) {
        return routeType == AiRouteType.RETURN_POLICY
                || routeType == AiRouteType.PAYMENT_REFUND_POLICY
                || routeType == AiRouteType.ORDER_STATUS;
    }

    private record ScoredEmbedding(AiEmbedding doc, double score) {}

    public record RetrievalResult(String contextText, List<SuggestedProduct> suggestedProducts) {
        public RetrievalResult {
            suggestedProducts = suggestedProducts == null ? List.of() : new ArrayList<>(suggestedProducts);
        }
    }
}
