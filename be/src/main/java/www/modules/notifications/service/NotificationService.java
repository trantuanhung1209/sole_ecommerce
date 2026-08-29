package www.modules.notifications.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.exception.ForbiddenException;
import www.exception.NotFoundException;
import www.model.enums.UserRole;
import www.modules.common.EcommerceEnums.NotificationType;
import www.modules.notifications.dto.NotificationDtos.NotificationResponse;
import www.modules.notifications.dto.NotificationDtos.UnreadCountResponse;
import www.modules.notifications.model.Notification;
import www.modules.notifications.repository.NotificationRepository;
import www.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final List<NotificationType> STAFF_ORDER_TYPES = List.of(NotificationType.STAFF_NEW_ORDER);
    private static final List<NotificationType> STAFF_RETURN_TYPES = List.of(NotificationType.STAFF_NEW_RETURN);

    private final NotificationRepository notificationRepository;
    private final NotificationSseHub sseHub;
    private final UserRepository userRepository;

    public Notification create(String userId, NotificationType type, String title, String message, String targetUrl) {
        Notification notification = notificationRepository.save(Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .targetUrl(targetUrl)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
        pushToUser(userId, notification);
        return notification;
    }

    public void notifyStaff(NotificationType type, String title, String message, String targetUrl) {
        userRepository.findByRoleIn(List.of(
                UserRole.STAFF, UserRole.SHOP_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN))
                .forEach(user -> create(user.getUserId(), type, title, message, targetUrl));
    }

    public Page<NotificationResponse> list(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    public List<NotificationResponse> recentUnread(String userId) {
        return notificationRepository.findTop20ByUserIdAndReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public UnreadCountResponse unreadCount(String userId) {
        long total = notificationRepository.countByUserIdAndReadFalse(userId);
        long pendingOrders = notificationRepository.countByUserIdAndReadFalseAndTypeIn(userId, STAFF_ORDER_TYPES);
        long pendingReturns = notificationRepository.countByUserIdAndReadFalseAndTypeIn(userId, STAFF_RETURN_TYPES);
        return UnreadCountResponse.builder()
                .total(total)
                .pendingOrders(pendingOrders)
                .pendingReturns(pendingReturns)
                .build();
    }

    public NotificationResponse markRead(String userId, String notificationId) {
        Notification notification = getOwned(userId, notificationId);
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        pushUnreadCount(userId);
        return toResponse(saved);
    }

    public void markAllRead(String userId) {
        notificationRepository.findByUserIdAndReadFalse(userId)
                .forEach(notification -> {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                });
        pushUnreadCount(userId);
    }

    private Notification getOwned(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + notificationId));
        if (!userId.equals(notification.getUserId())) {
            throw new ForbiddenException("Cannot access another user's notification");
        }
        return notification;
    }

    private void pushToUser(String userId, Notification notification) {
        sseHub.send(userId, "notification", toResponse(notification));
        pushUnreadCount(userId);
    }

    private void pushUnreadCount(String userId) {
        sseHub.send(userId, "unread_count", unreadCount(userId));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .targetUrl(notification.getTargetUrl())
                .read(Boolean.TRUE.equals(notification.getRead()))
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
