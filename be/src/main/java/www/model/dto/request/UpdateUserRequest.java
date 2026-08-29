package www.model.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import www.model.enums.Gender;
import www.model.enums.UserRole;

@Data
public class UpdateUserRequest {
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    private String phone;

    private Gender gender;

    private String dateOfBirth; // ISO date string

    private UserRole role;

    private Boolean isActive;
}
