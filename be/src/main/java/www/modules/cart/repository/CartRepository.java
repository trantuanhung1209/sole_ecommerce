package www.modules.cart.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.cart.model.Cart;
import www.modules.common.EcommerceEnums.CartStatus;

import java.util.Optional;

public interface CartRepository extends MongoRepository<Cart, String> {
    Optional<Cart> findFirstByUserIdAndStatus(String userId, CartStatus status);
}
