package www.modules.search;

import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.modules.catalog.dto.ProductDtos.ProductSummary;
import www.modules.catalog.dto.ProductFilter;
import www.modules.catalog.service.CatalogService;
import www.modules.search.config.SearchProperties;
import www.modules.search.elasticsearch.ElasticsearchProductSearch;
import www.modules.search.port.ProductSearchPort;

@Service
@Primary
public class ProductSearchRouter implements ProductSearchPort {

    private final CatalogService catalogService;
    private final ElasticsearchProductSearch elasticsearchProductSearch;
    private final SearchProperties searchProperties;

    public ProductSearchRouter(
            @Lazy CatalogService catalogService,
            ElasticsearchProductSearch elasticsearchProductSearch,
            SearchProperties searchProperties) {
        this.catalogService = catalogService;
        this.elasticsearchProductSearch = elasticsearchProductSearch;
        this.searchProperties = searchProperties;
    }

    @Override
    public Page<ProductSummary> search(ProductFilter filter, Pageable pageable) {
        if ("elasticsearch".equalsIgnoreCase(searchProperties.getEngine())) {
            try {
                return elasticsearchProductSearch.search(filter, pageable);
            } catch (Exception ignored) {
                // fallback Mongo
            }
        }
        return catalogService.searchPublishedMongo(filter, pageable);
    }
}
