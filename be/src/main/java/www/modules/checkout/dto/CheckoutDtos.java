package www.modules.checkout.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public final class CheckoutDtos {
    private CheckoutDtos() {}

    @Data
    public static class CheckoutRequest {
        @NotBlank
        private String addressId;
        private String customerNote;
        private String couponCode;
        private String paymentMethod = "SEPAY";
    }

    @Data
    public static class CheckoutPreview {
        private int itemCount;
        private double subtotal;
        private double discountTotal;
        private double shippingFee;
        private double taxTotal;
        private double grandTotal;
        private String couponCode;
        private boolean couponValid;
        private String couponMessage;
    }
}
