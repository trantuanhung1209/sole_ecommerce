package www.modules.catalog.search;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.stereotype.Service;
import www.modules.catalog.model.Product;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductTextSearchService {

    private final MongoTemplate mongoTemplate;

    public void ensureTextIndex() {
        IndexOperations indexOps = mongoTemplate.indexOps(Product.class);
        indexOps.ensureIndex(new TextIndexDefinition.TextIndexDefinitionBuilder()
                .onField("name", 10f)
                .onField("shortDescription", 5f)
                .onField("description", 1f)
                .build());
    }

    public List<Product> searchPublished(String keyword) {
        Query query = publishedBaseQuery();
        applyTextCriteria(query, keyword);
        return mongoTemplate.find(query, Product.class);
    }

    public List<Product> searchAllNonDeleted(String keyword) {
        Query query = new Query(Criteria.where("deleted").is(false));
        applyTextCriteria(query, keyword);
        return mongoTemplate.find(query, Product.class);
    }

    static String sanitizeTextSearch(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim()
                .replace("\"", " ")
                .replaceAll("[\\-+]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private Query publishedBaseQuery() {
        return new Query(Criteria.where("deleted").is(false)
                .and("status").is(ProductStatus.PUBLISHED)
                .and("publicStatus").is(PublicStatus.PUBLISHED));
    }

    private void applyTextCriteria(Query query, String keyword) {
        String sanitized = sanitizeTextSearch(keyword);
        if (sanitized.isBlank()) {
            return;
        }
        query.addCriteria(TextCriteria.forDefaultLanguage().matching(sanitized));
        query.with(Sort.by(Sort.Direction.DESC, "score"));
    }
}
