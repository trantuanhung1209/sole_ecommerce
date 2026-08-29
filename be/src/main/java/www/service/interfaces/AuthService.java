package www.service.interfaces;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import www.model.dto.request.*;
import www.model.dto.response.AuthResponse;
import www.model.dto.response.UserResponse;

public interface AuthService {
    void register(RegisterRequest request);
    AuthResponse verifyOtp(VerifyOtpRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    AuthResponse refresh(HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    void logout(HttpServletRequest httpRequest, String userId, HttpServletResponse httpResponse);
    UserResponse getCurrentUser(String userId);
    
    // Google OAuth2
    AuthResponse googleAuth(GoogleAuthRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    
    // Password management
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void changePassword(String userId, ChangePasswordRequest request);
    
    // Profile management
    UserResponse updateProfile(String userId, UpdateProfileRequest request);
}