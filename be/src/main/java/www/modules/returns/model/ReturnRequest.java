package www.modules.returns.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import www.modules.common.EcommerceEnums.RefundMethod;
import www.modules.common.EcommerceEnums.RefundStatus;
import www.modules.common.EcommerceEnums.ReturnItemCondition;
import www.modules.common.EcommerceEnums.ReturnStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "return_requests")
public class ReturnRequest {
    @Id
    private String returnId;
    @Indexed
    private String orderId;
    private String orderItemId;
    @Indexed
    private String userId;
    private String reason;
    private String customerNote;
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    @Builder.Default
    private ReturnStatus status = ReturnStatus.PENDING;
    private String staffNote;
    private String managerNote;
    private String rejectedReason;
    private Double refundAmount;
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.NOT_REQUIRED;
    private RefundMethod refundMethod;
    private String refundTransactionRef;
    private String refundNote;
    private String refundProofUrl;
    private String refundBankName;
    private String refundAccountNumber;
    private String refundAccountHolder;
    private ReturnItemCondition itemCondition;
    private String receiveNote;
    private Double maxRefundAmount;
    private LocalDateTime shipBackDeadlineAt;
    private String refundRequestedBy;
    private String refundedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime staffConfirmedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime receivedAt;
    private LocalDateTime refundRequestedAt;
    private LocalDateTime refundCompletedAt;
    private LocalDateTime refundedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime closedAt;
}
