package www.modules.orders.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.common.EcommerceEnums.FulfillmentStatus;
import www.modules.common.EcommerceEnums.OrderStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {
    @Id
    private String orderId;
    @Indexed(unique = true)
    private String orderCode;
    private String userId;
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;
    @Builder.Default
    private EcommercePaymentStatus paymentStatus = EcommercePaymentStatus.PENDING;
    @Builder.Default
    private FulfillmentStatus fulfillmentStatus = FulfillmentStatus.UNFULFILLED;
    private String shippingAddressSnapshot;
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
    private Double subtotal;
    @Builder.Default
    private Double discountTotal = 0.0;
    @Builder.Default
    private Double shippingFee = 30000.0;
    @Builder.Default
    private Double taxTotal = 0.0;
    private Double grandTotal;
    private String customerNote;
    private String cancelReason;
    @Field("created_at")
    private LocalDateTime createdAt;
    @Field("updated_at")
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime completedAt;
}
