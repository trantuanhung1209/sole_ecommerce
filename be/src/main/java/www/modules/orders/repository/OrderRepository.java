package www.modules.orders.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.orders.model.Order;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    Optional<Order> findByOrderCode(String orderCode);
    Page<Order> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @org.springframework.data.mongodb.repository.Query("{ 'orderCode': { $regex: ?0, $options: 'i' } }")
    Page<Order> findByOrderCodeContainingIgnoreCase(String orderCode, Pageable pageable);

    @org.springframework.data.mongodb.repository.Query("{ 'orderCode': { $regex: ?0, $options: 'i' }, 'status': ?1 }")
    Page<Order> findByOrderCodeContainingIgnoreCaseAndStatus(String orderCode, OrderStatus status, Pageable pageable);

    List<Order> findByStatusAndDeliveredAtBefore(OrderStatus status, LocalDateTime deliveredAt);
}
