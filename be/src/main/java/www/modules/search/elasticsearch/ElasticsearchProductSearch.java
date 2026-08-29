package www.modules.search.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.modules.catalog.dto.ProductDtos.ProductSummary;
import www.modules.catalog.dto.ProductFilter;
import www.modules.search.config.SearchProperties;
import www.modules.search.document.ProductDocument;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchProductSearch {

    private final ElasticsearchClient elasticsearchClient;
    private final SearchProperties searchProperties;

    public Page<ProductSummary> search(ProductFilter filter, Pageable pageable) throws Exception {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<Page<ProductSummary>> future = executor.submit(() -> doSearch(filter, pageable));
            return future.get(searchProperties.getTimeoutMs(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            log.warn("Elasticsearch search timed out after {}ms — caller should fallback", searchProperties.getTimeoutMs());
            throw e;
        } finally {
            executor.shutdownNow();
        }
    }

    private Page<ProductSummary> doSearch(ProductFilter filter, Pageable pageable) throws Exception {
        List<Query> must = new ArrayList<>();
        if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
            must.add(Query.of(q -> q.multiMatch(m -> m
                    .query(filter.getSearch())
                    .fields("name^3", "slug", "brandName", "variants.sku"))));
        }
        List<Query> filterQueries = new ArrayList<>();
        if (filter.getBrandId() != null) {
            filterQueries.add(Query.of(q -> q.term(t -> t.field("brandId").value(filter.getBrandId()))));
        }
        if (filter.getCategoryId() != null) {
            filterQueries.add(Query.of(q -> q.term(t -> t.field("categoryIds").value(filter.getCategoryId()))));
        }
        if (filter.getGender() != null) {
            filterQueries.add(Query.of(q -> q.term(t -> t.field("gender").value(filter.getGender().name()))));
        }
        if (hasVariantFilters(filter)) {
            filterQueries.add(buildVariantNestedQuery(filter));
        }

        BoolQuery.Builder bool = new BoolQuery.Builder();
        if (!must.isEmpty()) {
            bool.must(must);
        }
        if (!filterQueries.isEmpty()) {
            bool.filter(filterQueries);
        }

        SearchRequest.Builder request = new SearchRequest.Builder()
                .index(searchProperties.getIndexName())
                .from((int) pageable.getOffset())
                .size(pageable.getPageSize())
                .query(q -> q.bool(bool.build()));

        applySort(request, filter.getSort());

        SearchResponse<ProductDocument> response = elasticsearchClient.search(request.build(), ProductDocument.class);
        List<ProductSummary> items = new ArrayList<>();
        for (Hit<ProductDocument> hit : response.hits().hits()) {
            ProductDocument doc = hit.source();
            if (doc != null) {
                items.add(ProductSummary.builder()
                        .productId(doc.getProductId())
                        .name(doc.getName())
                        .slug(doc.getSlug())
                        .brandId(doc.getBrandId())
                        .brandName(doc.getBrandName())
                        .categoryIds(doc.getCategoryIds())
                        .genderTarget(doc.getGender())
                        .minPrice(doc.getMinPrice())
                        .compareAtPrice(doc.getCompareAtPrice())
                        .build());
            }
        }
        long total = response.hits().total() != null ? response.hits().total().value() : items.size();
        return new PageImpl<>(items, pageable, total);
    }

    private void applySort(SearchRequest.Builder request, String sort) {
        if ("price_asc".equalsIgnoreCase(sort)) {
            request.sort(s -> s.field(f -> f.field("minPrice").order(SortOrder.Asc)));
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            request.sort(s -> s.field(f -> f.field("minPrice").order(SortOrder.Desc)));
        } else if ("rating".equalsIgnoreCase(sort)) {
            request.sort(s -> s.field(f -> f.field("rating").order(SortOrder.Desc)));
        } else {
            request.sort(s -> s.field(f -> f.field("publishedAt").order(SortOrder.Desc)));
        }
    }

    private boolean hasVariantFilters(ProductFilter filter) {
        return filter.getSize() != null
                || filter.getColor() != null
                || Boolean.TRUE.equals(filter.getInStock())
                || filter.getMinPrice() != null
                || filter.getMaxPrice() != null;
    }

    private Query buildVariantNestedQuery(ProductFilter filter) {
        List<Query> nestedMust = new ArrayList<>();
        if (filter.getSize() != null) {
            nestedMust.add(Query.of(q -> q.term(t -> t.field("variants.size").value(filter.getSize()))));
        }
        if (filter.getColor() != null) {
            nestedMust.add(Query.of(q -> q.match(m -> m.field("variants.color").query(filter.getColor()))));
        }
        if (filter.getMinPrice() != null) {
            nestedMust.add(Query.of(q -> q.range(r -> r.number(n -> n.field("variants.price").gte(filter.getMinPrice())))));
        }
        if (filter.getMaxPrice() != null) {
            nestedMust.add(Query.of(q -> q.range(r -> r.number(n -> n.field("variants.price").lte(filter.getMaxPrice())))));
        }
        if (Boolean.TRUE.equals(filter.getInStock())) {
            nestedMust.add(Query.of(q -> q.range(r -> r.number(n -> n.field("variants.available").gt(0.0)))));
        }
        return Query.of(q -> q.nested(n -> n
                .path("variants")
                .query(nq -> nq.bool(b -> b.must(nestedMust)))));
    }
}
