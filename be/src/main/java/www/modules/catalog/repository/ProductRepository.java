package www.modules.catalog.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.catalog.model.Product;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;

import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySlug(String slug);

    Page<Product> findByDeletedFalse(Pageable pageable);

    Page<Product> findByStatusAndPublicStatusAndDeletedFalse(
            ProductStatus status, PublicStatus publicStatus, Pageable pageable);

    long countByStatusAndPublicStatusAndDeletedFalse(ProductStatus status, PublicStatus publicStatus);
}
