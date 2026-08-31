package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.service.ImageSearchMatcher;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ImageSearchMatcherTest {

    @Test
    void rejectsUnrelatedProductWhenBrandAndModelIdentified() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .brand("MLB")
                .model("Chunky Liner")
                .brandIdentified(true)
                .description("Giày MLB Chunky Liner màu trắng")
                .searchQuery("MLB Chunky Liner")
                .build();

        List<SuggestedProduct> products = List.of(
                product("p1", "Adidas Samba OG"),
                product("p2", "Nike Air Force 1 '07"),
                product("p3", "Nike Air Max 90")
        );
        List<String> brands = List.of("Adidas", "Nike", "Nike");

        List<SuggestedProduct> matches = ImageSearchMatcher.filterExactMatches(products, vision, brands);

        assertTrue(matches.isEmpty());
    }

    @Test
    void acceptsProductWhenBrandAndModelMatch() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .brand("MLB")
                .model("Chunky Liner")
                .brandIdentified(true)
                .searchQuery("MLB Chunky Liner")
                .build();

        List<SuggestedProduct> products = List.of(product("p1", "MLB Chunky Liner Classic"));
        List<String> brands = List.of("MLB");

        List<SuggestedProduct> matches = ImageSearchMatcher.filterExactMatches(products, vision, brands);

        assertEquals(1, matches.size());
        assertEquals("p1", matches.get(0).getProductId());
    }

    private static SuggestedProduct product(String id, String name) {
        return SuggestedProduct.builder().productId(id).name(name).slug(id).minPrice(1000000d).build();
    }
}
