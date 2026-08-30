package www.modules.payments.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ecommerce_payments")
public class EcommercePayment {
    @Id
    private String paymentId;
    private String orderId;
    private String orderCode;
    @Indexed(unique = true)
    private String orderInvoiceNumber;
    private Double amount;
    @Builder.Default
    private String currency = "VND";
    @Builder.Default
    private String method = "SEPAY";
    @Builder.Default
    private EcommercePaymentStatus status = EcommercePaymentStatus.PENDING;
    private String paymentUrl;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    @Indexed(sparse = true)
    private String transactionId;
    private String gatewayResponse;
    private LocalDateTime paidAt;
    private LocalDateTime failedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime expiredAt;
    private www.modules.common.EcommerceEnums.RefundStatus refundStatus;
    private www.modules.common.EcommerceEnums.RefundMethod refundMethod;
    private Double refundedAmount;
    private String refundTransactionRef;
    private String refundProofUrl;
    private String refundNote;
    private LocalDateTime refundedAt;
    @Field("created_at")
    private LocalDateTime createdAt;
    @Field("updated_at")
    private LocalDateTime updatedAt;
}
