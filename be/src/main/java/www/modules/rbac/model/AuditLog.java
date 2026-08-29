package www.modules.rbac.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String auditLogId;
    private String actorId;
    private String action;
    private String targetType;
    private String targetId;
    private String beforeValue;
    private String afterValue;
    private String reason;
    private LocalDateTime createdAt;
}
