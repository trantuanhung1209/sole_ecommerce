package www.modules.payments.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.payments.model.EcommercePayment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EcommercePaymentRepository extends MongoRepository<EcommercePayment, String> {
    Optional<EcommercePayment> findByOrderInvoiceNumber(String orderInvoiceNumber);
    Optional<EcommercePayment> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);
    List<EcommercePayment> findByStatusAndExpiredAtBefore(EcommercePaymentStatus status, LocalDateTime now);
}
