package www.modules.rbac.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.rbac.model.AuditLog;

import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
}
