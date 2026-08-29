package www.modules.returns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import www.modules.common.EcommerceEnums.ReturnStatus;

import java.util.ArrayList;
import java.util.List;

public final class ReturnDtos {
    private ReturnDtos() {}

    @Data
    public static class CreateReturnRequest {
        @NotBlank
        private String orderId;
        @NotBlank
        private String orderItemId;
        @NotBlank
        private String reason;
        private String customerNote;
        private List<String> imageUrls = new ArrayList<>();
    }

    @Data
    public static class UpdateReturnStatusRequest {
        @NotNull
        private ReturnStatus status;
        private String note;
        private String rejectedReason;
        private Double refundAmount;
    }
}
