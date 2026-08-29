package www.modules.notifications.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.modules.common.EcommerceEnums.NotificationType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndex(name = "user_read_created", def = "{ 'userId': 1, 'read': 1, 'createdAt': -1 }")
public class Notification {
    @Id
    private String notificationId;
    @Indexed
    private String userId;
    private NotificationType type;
    private String title;
    private String message;
    private String targetUrl;
    @Builder.Default
    private Boolean read = false;
    @Field("created_at")
    private LocalDateTime createdAt;
}
