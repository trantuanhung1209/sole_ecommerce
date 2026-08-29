package www.modules.payments.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.payments.model.PaymentEvent;

import java.util.Optional;

public interface PaymentEventRepository extends MongoRepository<PaymentEvent, String> {
    Optional<PaymentEvent> findByGatewayAndTransactionId(String gateway, String transactionId);
}
