package www.modules.rbac.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "role_permissions")
@CompoundIndex(name = "role_permission_unique", def = "{ 'roleCode': 1, 'permissionCode': 1 }", unique = true)
public class RolePermission {
    @Id
    private String rolePermissionId;
    private String roleCode;
    private String permissionCode;
    @Builder.Default
    private Boolean enabled = false;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
