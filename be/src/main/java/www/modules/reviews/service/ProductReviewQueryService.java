package www.modules.reviews.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import www.modules.reviews.model.ProductReview;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ProductReviewQueryService {
    private final MongoTemplate mongoTemplate;

    public Page<ProductReview> findReviews(ReviewBrowseFilter filter, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (filter.visibleOnly()) {
            criteria.add(Criteria.where("visible").is(true));
        } else if (filter.visible() != null) {
            criteria.add(Criteria.where("visible").is(filter.visible()));
        }

        if (filter.rating() != null) {
            criteria.add(Criteria.where("rating").is(filter.rating()));
        }

        if (filter.productId() != null && !filter.productId().isBlank()) {
            criteria.add(Criteria.where("productId").is(filter.productId()));
        }

        if (filter.search() != null && !filter.search().isBlank()) {
            String keyword = Pattern.quote(filter.search().trim());
            criteria.add(new Criteria().orOperator(
                    Criteria.where("title").regex(keyword, "i"),
                    Criteria.where("content").regex(keyword, "i")));
        }

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
        }

        long total = mongoTemplate.count(query, ProductReview.class);
        query.with(resolveSort(filter.sort())).with(pageable);
        List<ProductReview> content = mongoTemplate.find(query, ProductReview.class);
        return new PageImpl<>(content, pageable, total);
    }

    private Sort resolveSort(String sort) {
        if (sort == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sort.toUpperCase()) {
            case "RATING_DESC" -> Sort.by(Sort.Direction.DESC, "rating", "createdAt");
            case "RATING_ASC" -> Sort.by(Sort.Direction.ASC, "rating", "createdAt");
            case "HELPFUL" -> Sort.by(Sort.Direction.DESC, "helpfulCount", "createdAt");
            case "OLDEST" -> Sort.by(Sort.Direction.ASC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    public record ReviewBrowseFilter(
            boolean visibleOnly,
            Boolean visible,
            Integer rating,
            String productId,
            String search,
            String sort) {
    }
}
