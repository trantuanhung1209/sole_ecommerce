package www.modules.payments.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payment_events")
@CompoundIndex(name = "gateway_transaction_unique", def = "{ 'gateway': 1, 'transactionId': 1 }", unique = true)
public class PaymentEvent {
    @Id
    private String paymentEventId;
    private String gateway;
    private String orderInvoiceNumber;
    private String transactionId;
    private String eventType;
    private String rawPayload;
    private String signature;
    @Builder.Default
    private Boolean processed = false;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
