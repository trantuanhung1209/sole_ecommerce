package www.modules.payments.dto;

import lombok.*;

import java.util.Map;

public final class PaymentDtos {
    private PaymentDtos() {}

    @Data
    public static class PaymentCallbackRequest {
        private String orderInvoiceNumber;
        private String status;
        private String transactionId;
        private Map<String, Object> payload;
    }

    @Data
    @Builder
    public static class PaymentCheckoutResponse {
        private String paymentId;
        private String orderId;
        private String orderInvoiceNumber;
        private Double amount;
        private String currency;
        private String paymentUrl;
        private Map<String, String> formData;
    }
}
