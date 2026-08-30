package www.modules.catalog.search;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductTextIndexInitializer {

    private final ProductTextSearchService productTextSearchService;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        productTextSearchService.ensureTextIndex();
    }
}
