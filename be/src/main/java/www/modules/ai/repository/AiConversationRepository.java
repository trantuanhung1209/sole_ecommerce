package www.modules.ai.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.ai.model.AiConversation;

import java.util.List;

public interface AiConversationRepository extends MongoRepository<AiConversation, String> {
    List<AiConversation> findByUserIdOrderByUpdatedAtDesc(String userId);
}
