package www.modules.catalog.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.catalog.model.Category;

import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    Optional<Category> findBySlug(String slug);
}
