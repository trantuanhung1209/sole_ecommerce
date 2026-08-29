package www.modules.rbac.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.rbac.model.Permission;

import java.util.Optional;

public interface PermissionRepository extends MongoRepository<Permission, String> {
    Optional<Permission> findByCode(String code);
}
