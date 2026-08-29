package www.modules.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.ai.model.AiEmbedding;
import www.modules.ai.model.AiEntityType;
import www.modules.ai.repository.AiEmbeddingRepository;
import www.modules.ai.service.AiRetrievalService;
import www.modules.ai.service.OpenAiEmbeddingAdapter;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiRetrievalServiceTest {
    @Mock private OpenAiEmbeddingAdapter embeddingAdapter;
    @Mock private AiEmbeddingRepository embeddingRepository;
    @Mock private CatalogContextProvider catalogContextProvider;

    @InjectMocks
    private AiRetrievalService retrievalService;

    @BeforeEach
    void setUp() {
        lenient().when(embeddingAdapter.isConfigured()).thenReturn(true);
        lenient().when(embeddingAdapter.embed(anyString())).thenReturn(List.of(1.0, 0.0));
        lenient().when(catalogContextProvider.searchByKeyword(anyString()))
                .thenReturn(new CatalogContextProvider.SearchResult("", List.of()));
    }

    @Test
    void retrieve_prefersMatchingProductEmbedding() {
        AiEmbedding product = AiEmbedding.builder()
                .entityType(AiEntityType.PRODUCT)
                .entityId("p1")
                .embedding(List.of(1.0, 0.0))
                .text("Nike Air")
                .build();
        AiEmbedding policy = AiEmbedding.builder()
                .entityType(AiEntityType.POLICY)
                .entityId("return")
                .embedding(List.of(0.0, 1.0))
                .text("return policy")
                .build();
        when(embeddingRepository.findAll()).thenReturn(List.of(product, policy));
        when(catalogContextProvider.hydrateByProductIds(anyList()))
                .thenReturn(new CatalogContextProvider.SearchResult(
                        "product context",
                        List.of(SuggestedProduct.builder().productId("p1").name("Nike Air").slug("nike-air").build())
                ));

        var result = retrievalService.retrieve("nike running", AiRouteType.PRODUCT_INFO);

        assertFalse(result.suggestedProducts().isEmpty());
        assertEquals("p1", result.suggestedProducts().get(0).getProductId());
    }

    @Test
    void retrieve_fallsBackToKeywordWhenEmbeddingMissing() {
        when(embeddingAdapter.isConfigured()).thenReturn(false);
        when(catalogContextProvider.searchByKeyword("giày"))
                .thenReturn(new CatalogContextProvider.SearchResult("fallback", List.of()));

        var result = retrievalService.retrieve("giày", AiRouteType.PRODUCT_INFO);

        assertEquals("fallback", result.contextText());
    }
}
