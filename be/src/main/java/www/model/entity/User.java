package www.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import www.model.enums.AuthProviderType;
import www.model.enums.Gender;
import www.model.enums.UserRole;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    
    @Id
    private String userId;
    
    @Field("full_name")
    private String fullName;
    
    @Indexed(unique = true)
    @Field("email")
    private String email;
    
    @Field("password")
    private String password;
    
    @Field("auth_type")
    private AuthProviderType authType;
    
    @Field("google_auth")
    private GoogleAuth googleAuth;
    
    @Field("gender")
    private Gender gender;
    
    @Field("date_of_birth")
    private LocalDate dateOfBirth;
    
    @Field("avatar")
    private String avatar;
    
    @Field("phone")
    private String phone;

    @Builder.Default
    private boolean enabled = false;
    
    @Builder.Default
    @Field("is_active")
    private Boolean isActive = true;
    
    @Builder.Default
    @Field("is_email_verified")
    private Boolean isEmailVerified = false;
    
    @Builder.Default
    @Field("role")
    private UserRole role = UserRole.CUSTOMER;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
    
    @Field("last_login_at")
    private LocalDateTime lastLoginAt;

}