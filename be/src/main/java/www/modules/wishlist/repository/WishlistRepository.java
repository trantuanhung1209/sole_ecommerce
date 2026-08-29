package www.modules.wishlist.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.wishlist.model.WishlistItem;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends MongoRepository<WishlistItem, String> {
    List<WishlistItem> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<WishlistItem> findByUserIdAndProductId(String userId, String productId);
    void deleteByUserIdAndProductId(String userId, String productId);
}
