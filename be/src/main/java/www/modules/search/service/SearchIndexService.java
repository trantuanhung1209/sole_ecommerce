package www.modules.search.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.mapping.*;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import co.elastic.clients.elasticsearch.indices.ExistsRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import www.modules.catalog.model.Product;
import www.modules.catalog.repository.ProductRepository;
import www.modules.common.EcommerceEnums.PublicStatus;
import www.modules.search.config.SearchProperties;
import www.modules.search.document.ProductDocument;
import www.modules.search.mapper.ProductIndexMapper;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchIndexService {

    private final ElasticsearchClient elasticsearchClient;
    private final SearchProperties searchProperties;
    private final ProductIndexMapper productIndexMapper;
    private final ProductRepository productRepository;

    public void ensureIndex() throws IOException {
        String index = searchProperties.getIndexName();
        boolean exists = elasticsearchClient.indices().exists(ExistsRequest.of(e -> e.index(index))).value();
        if (exists) {
            return;
        }
        elasticsearchClient.indices().create(CreateIndexRequest.of(c -> c
                .index(index)
                .settings(s -> s
                        .analysis(a -> a
                                .analyzer("vi_analyzer", an -> an
                                        .custom(cu -> cu
                                                .tokenizer("standard")
                                                .filter("lowercase")))))
                .mappings(m -> m
                        .properties("name", p -> p.text(t -> t.analyzer("vi_analyzer")))
                        .properties("slug", p -> p.keyword(k -> k))
                        .properties("brandId", p -> p.keyword(k -> k))
                        .properties("brandName", p -> p.text(t -> t.analyzer("vi_analyzer")))
                        .properties("categoryIds", p -> p.keyword(k -> k))
                        .properties("gender", p -> p.keyword(k -> k))
                        .properties("minPrice", p -> p.double_(d -> d))
                        .properties("compareAtPrice", p -> p.double_(d -> d))
                        .properties("rating", p -> p.double_(d -> d))
                        .properties("publishedAt", p -> p.date(d -> d))
                        .properties("variants", p -> p.nested(n -> n
                                .properties("sku", np -> np.keyword(k -> k))
                                .properties("size", np -> np.keyword(k -> k))
                                .properties("color", np -> np.text(t -> t))
                                .properties("price", np -> np.double_(d -> d))
                                .properties("available", np -> np.integer(i -> i)))))));
        log.info("Created Elasticsearch index {}", index);
    }

    @Async
    public void indexProductAsync(String productId) {
        try {
            indexProduct(productId);
        } catch (Exception e) {
            log.warn("Failed to index product {}: {}", productId, e.getMessage());
        }
    }

    public void indexProduct(String productId) throws IOException {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || Boolean.TRUE.equals(product.getDeleted())
                || product.getPublicStatus() != PublicStatus.PUBLISHED) {
            deleteProduct(productId);
            return;
        }
        ensureIndex();
        ProductDocument doc = productIndexMapper.toDocument(product);
        elasticsearchClient.index(i -> i
                .index(searchProperties.getIndexName())
                .id(productId)
                .document(doc));
    }

    public void deleteProduct(String productId) throws IOException {
        try {
            elasticsearchClient.delete(d -> d.index(searchProperties.getIndexName()).id(productId));
        } catch (Exception e) {
            log.debug("Delete index doc {}: {}", productId, e.getMessage());
        }
    }

    public int reindexAll() throws IOException {
        ensureIndex();
        List<Product> published = productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
                .filter(p -> p.getPublicStatus() == PublicStatus.PUBLISHED)
                .toList();
        for (Product product : published) {
            ProductDocument doc = productIndexMapper.toDocument(product);
            elasticsearchClient.index(i -> i
                    .index(searchProperties.getIndexName())
                    .id(product.getProductId())
                    .document(doc));
        }
        return published.size();
    }
}
