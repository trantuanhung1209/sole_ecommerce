package www.model.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;
import www.model.enums.Gender;

@Data
public class UpdateProfileRequest {
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @Size(max = 15, message = "Phone cannot exceed 15 characters")
    private String phone;

    @Size(max = 200, message = "Address cannot exceed 200 characters")
    private String address;

    private Gender gender;

    @Size(max = 20, message = "Identity number cannot exceed 20 characters")
    private String identityNumber;

    // Avatar as base64 string for Cloudinary upload
    private String avatar;
}