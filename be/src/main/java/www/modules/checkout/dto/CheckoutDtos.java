package www.modules.checkout.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public final class CheckoutDtos {
    private CheckoutDtos() {}

    @Data
    public static class CheckoutRequest {
        @NotBlank
        private String shippingAddress;
        private String customerNote;
        private String paymentMethod = "SEPAY";
    }

    @Data
    public static class CheckoutPreview {
        private int itemCount;
        private double subtotal;
        private double shippingFee;
        private double grandTotal;
    }
}
