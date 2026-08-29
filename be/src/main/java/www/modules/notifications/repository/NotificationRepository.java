package www.modules.notifications.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.common.EcommerceEnums.NotificationType;
import www.modules.notifications.model.Notification;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndReadFalse(String userId);

    long countByUserIdAndReadFalseAndTypeIn(String userId, List<NotificationType> types);

    List<Notification> findTop20ByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndReadFalse(String userId);
}
