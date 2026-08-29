package www.modules.ai.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.ai.model.AiEmbedding;
import www.modules.ai.model.AiEntityType;

import java.util.List;
import java.util.Optional;

public interface AiEmbeddingRepository extends MongoRepository<AiEmbedding, String> {
    List<AiEmbedding> findByEntityType(AiEntityType entityType);

    Optional<AiEmbedding> findByEntityTypeAndEntityId(AiEntityType entityType, String entityId);

    void deleteByEntityTypeAndEntityId(AiEntityType entityType, String entityId);
}
