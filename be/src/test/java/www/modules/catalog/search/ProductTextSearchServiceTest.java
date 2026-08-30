package www.modules.catalog.search;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductTextSearchServiceTest {

    @Test
    void sanitizeTextSearch_stripsQuotesAndNegationChars() {
        assertEquals("nike air", ProductTextSearchService.sanitizeTextSearch("\"nike -air\""));
    }

    @Test
    void sanitizeTextSearch_collapsesWhitespace() {
        assertEquals("nike dunk", ProductTextSearchService.sanitizeTextSearch("  nike   dunk  "));
    }

    @Test
    void sanitizeTextSearch_nullOrBlank() {
        assertEquals("", ProductTextSearchService.sanitizeTextSearch(null));
        assertEquals("", ProductTextSearchService.sanitizeTextSearch("   "));
    }
}
