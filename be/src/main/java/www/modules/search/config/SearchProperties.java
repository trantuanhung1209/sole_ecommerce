package www.modules.search.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "search")
public class SearchProperties {
    /** elasticsearch | mongo */
    private String engine = "mongo";
    private String indexName = "sole-products";
    private String elasticsearchUri = "http://localhost:9200";
    private long timeoutMs = 200;
}
