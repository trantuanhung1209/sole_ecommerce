package www.modules.catalog.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.catalog.model.Brand;

import java.util.Optional;

public interface BrandRepository extends MongoRepository<Brand, String> {
    Optional<Brand> findBySlug(String slug);
}
