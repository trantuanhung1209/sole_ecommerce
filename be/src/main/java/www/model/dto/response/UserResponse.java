package www.model.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import www.model.entity.GoogleAuth;
import www.model.enums.AuthProviderType;
import www.model.enums.Gender;
import www.model.enums.UserRole;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private String id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private Gender gender;
    private String identityNumber;
    private String avatar;
    private LocalDate dateOfBirth;
    private AuthProviderType authType;
    private GoogleAuth googleAuth;
    private boolean enabled;
    private Boolean isActive;
    private Boolean isEmailVerified;
    private UserRole role;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime updatedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime lastLoginAt;
    
    // Không bao gồm password để bảo vệ thông tin nhạy cảm
}