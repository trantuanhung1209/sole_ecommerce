package www.modules.reviews.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.reviews.model.ProductReview;

import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends MongoRepository<ProductReview, String> {
    Page<ProductReview> findByProductIdAndVisibleTrueOrderByCreatedAtDesc(String productId, Pageable pageable);
    List<ProductReview> findByProductIdAndVisibleTrue(String productId);
    Optional<ProductReview> findByUserIdAndOrderIdAndOrderItemId(String userId, String orderId, String orderItemId);
}
