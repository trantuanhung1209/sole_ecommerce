package www.modules.rbac.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.rbac.model.RolePermission;

import java.util.List;
import java.util.Optional;

public interface RolePermissionRepository extends MongoRepository<RolePermission, String> {
    List<RolePermission> findByRoleCode(String roleCode);
    Optional<RolePermission> findByRoleCodeAndPermissionCode(String roleCode, String permissionCode);
}
