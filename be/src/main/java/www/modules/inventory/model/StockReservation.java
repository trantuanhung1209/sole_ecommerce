package www.modules.inventory.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.modules.common.EcommerceEnums.ReservationStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stock_reservations")
public class StockReservation {
    @Id
    private String reservationId;
    @Field("order_id")
    private String orderId;
    @Field("variant_id")
    private String variantId;
    private Integer quantity;
    @Builder.Default
    private ReservationStatus status = ReservationStatus.ACTIVE;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
