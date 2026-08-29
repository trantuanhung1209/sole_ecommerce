package www.modules.inventory.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.common.EcommerceEnums.ReservationStatus;
import www.modules.inventory.model.StockReservation;

import java.time.LocalDateTime;
import java.util.List;

public interface StockReservationRepository extends MongoRepository<StockReservation, String> {
    List<StockReservation> findByOrderId(String orderId);
    List<StockReservation> findByStatusAndExpiresAtBefore(ReservationStatus status, LocalDateTime now);
}
