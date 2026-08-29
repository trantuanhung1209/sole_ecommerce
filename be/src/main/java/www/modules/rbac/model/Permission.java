package www.modules.rbac.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import www.modules.common.EcommerceEnums.PermissionGroup;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "permissions")
public class Permission {
    @Id
    private String permissionId;
    @Indexed(unique = true)
    private String code;
    private String name;
    private String description;
    private PermissionGroup group;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
