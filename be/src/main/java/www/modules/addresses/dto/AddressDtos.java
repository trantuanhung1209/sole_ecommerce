package www.modules.addresses.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressDtos {
    @Data
    public static class AddressRequest {
        @NotBlank
        private String recipientName;
        @NotBlank
        private String phone;
        @NotBlank
        private String line1;
        private String line2;
        private String ward;
        private String district;
        @NotBlank
        private String city;
        private Boolean isDefault;
    }
}
