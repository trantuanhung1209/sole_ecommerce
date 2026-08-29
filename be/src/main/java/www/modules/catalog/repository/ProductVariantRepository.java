package www.modules.catalog.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.catalog.model.ProductVariant;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends MongoRepository<ProductVariant, String> {
    List<ProductVariant> findByProductId(String productId);
    Optional<ProductVariant> findBySku(String sku);
}
