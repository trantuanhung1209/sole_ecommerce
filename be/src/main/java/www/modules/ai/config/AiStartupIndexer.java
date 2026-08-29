package www.modules.ai.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import www.modules.ai.service.AiIndexService;

@Component
@RequiredArgsConstructor
public class AiStartupIndexer {
    private final AiIndexService aiIndexService;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        aiIndexService.ensureIndexed();
    }
}
