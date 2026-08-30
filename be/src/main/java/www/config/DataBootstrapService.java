package www.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import www.modules.search.config.SearchProperties;
import www.modules.search.service.SearchIndexService;

/**
 * Runs once the app is fully up (after all seed {@code @PostConstruct} hooks).
 * Reindexes Elasticsearch so demo handoffs work with a single {@code docker compose up}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataBootstrapService {

    private final SearchIndexService searchIndexService;
    private final SearchProperties searchProperties;

    @Value("${app.bootstrap.reindex-on-startup:true}")
    private boolean reindexOnStartup;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!reindexOnStartup) {
            return;
        }
        if (!"elasticsearch".equalsIgnoreCase(searchProperties.getEngine())) {
            log.debug("Startup reindex skipped — search.engine={}", searchProperties.getEngine());
            return;
        }
        try {
            int indexed = searchIndexService.reindexAll();
            log.info("Startup search reindex complete — {} product(s) indexed in Elasticsearch", indexed);
        } catch (Exception e) {
            log.warn("Startup search reindex failed (search may be stale until manual reindex): {}", e.getMessage());
        }
    }
}
