package www.modules.returns.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.returns.model.ReturnRequest;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends MongoRepository<ReturnRequest, String> {
    Page<ReturnRequest> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<ReturnRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ReturnRequest> findByStatusOrderByCreatedAtDesc(ReturnStatus status, Pageable pageable);
    Optional<ReturnRequest> findByOrderIdAndOrderItemId(String orderId, String orderItemId);
    List<ReturnRequest> findByOrderId(String orderId);
    long countByStatus(ReturnStatus status);
}
