package www.modules.notifications.dto;

import lombok.Builder;
import lombok.Data;
import www.modules.common.EcommerceEnums.NotificationType;

import java.time.LocalDateTime;

public final class NotificationDtos {
    private NotificationDtos() {}

    @Data
    @Builder
    public static class NotificationResponse {
        private String notificationId;
        private String userId;
        private NotificationType type;
        private String title;
        private String message;
        private String targetUrl;
        private boolean read;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class UnreadCountResponse {
        private long total;
        private long pendingOrders;
        private long pendingReturns;
    }
}
