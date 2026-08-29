package www.modules.rbac.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.rbac.model.Role;

import java.util.Optional;

public interface RoleRepository extends MongoRepository<Role, String> {
    Optional<Role> findByCode(String code);
}
