package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.ai.dto.ImageSearchContext;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.service.ImageSearchService;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.service.context.CatalogContextProvider.SearchResult;
import www.modules.catalog.service.CatalogService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageSearchServiceTest {

    @Mock private CatalogContextProvider catalogContextProvider;
    @Mock private CatalogService catalogService;

    @InjectMocks
    private ImageSearchService imageSearchService;

    @Test
    void returnsNoMatchWhenBrandIdentifiedButCatalogHasOnlyUnrelatedProducts() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .brand("MLB")
                .model("Chunky Liner")
                .brandIdentified(true)
                .description("Giày MLB Chunky Liner")
                .searchQuery("MLB Chunky Liner")
                .build();

        when(catalogContextProvider.searchWithFilters(eq("MLB Chunky Liner"), isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(new SearchResult("", List.of()));

        ImageSearchContext result = imageSearchService.resolve(vision);

        assertFalse(result.exactMatch());
        assertTrue(result.products().isEmpty());
    }
}
