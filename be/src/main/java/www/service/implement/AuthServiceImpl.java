package www.service.implement;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.AuthException;
import www.model.dto.request.*;
import www.model.dto.response.AuthResponse;
import www.model.dto.response.UserResponse;
import www.model.entity.GoogleAuth;
import www.model.entity.User;
import www.service.interfaces.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    
    private final UserService userService;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final SessionService sessionService;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client-id}")
    private String googleClientId;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        // Check if user already exists
        Optional<User> existingUser = userService.findByEmail(request.getEmail());
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            
            // If user exists but email is not verified, allow re-registration with new password
            if (!user.getIsEmailVerified()) {
                try {
                    // Update user info and password
                    userService.updateUnverifiedUser(
                            request.getEmail(),
                            request.getFullName(),
                            request.getPassword()
                    );
                    
                    // Generate and save new OTP
                    String otp = otpService.generateOtp();
                    otpService.saveOtp(request.getEmail(), otp);

                    // Send OTP email
                    mailService.sendOtpMail(request.getEmail(), otp);

                    log.info("Updated unverified user and resent OTP: {}", request.getEmail());
                    return;
                    
                } catch (Exception e) {
                    log.error("Failed to update unverified user: {}", request.getEmail(), e);
                    throw new AuthException("Cập nhật thông tin thất bại: " + e.getMessage(), e);
                }
            }
            
            // If user exists and email is verified
            throw new AuthException("Email đã tồn tại");
        }

        try {
            // Create user
            User user = userService.createUser(
                    request.getEmail(),
                    request.getFullName(),
                    request.getPassword()
            );

            // Generate and save OTP
            String otp = otpService.generateOtp();
            otpService.saveOtp(request.getEmail(), otp);

            // Send OTP email
            mailService.sendOtpMail(request.getEmail(), otp);

            log.info("User registered successfully: {}", request.getEmail());

        } catch (Exception e) {
            log.error("Registration failed for email: {}", request.getEmail(), e);
            throw new AuthException("Đăng ký thất bại: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        // Validate OTP
        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new AuthException("Token sai hoặc hết hạn");
        }

        try {
            // Enable user
            User user = userService.enableUser(request.getEmail());

            // Create session
            String userAgent = httpRequest.getHeader("User-Agent");
            String ip = getClientIpAddress(httpRequest);
            String sessionId = sessionService.createSession(user.getUserId(), userAgent, ip);
            issueAuthTokens(user, sessionId, httpResponse);

            // Create user response
            UserResponse userResponse = UserResponse.builder()
                    .id(user.getUserId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .avatar(user.getAvatar())
                    .role(user.getRole())
                    .authType(user.getAuthType())
                    .googleAuth(user.getGoogleAuth())
                    .enabled(user.getIsActive())
                    .build();

            log.info("OTP verified and user enabled: {}", request.getEmail());
            return AuthResponse.builder()
                    .user(userResponse)
                    .build();

        } catch (Exception e) {
            log.error("OTP verification failed for email: {}", request.getEmail(), e);
            throw new AuthException("Xác thực OTP thất bại: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        // Find user
        User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Email hoặc mật khẩu không chính xác"));

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Email hoặc mật khẩu không chính xác");
        }

        // Check if email is verified
        if (!user.getIsEmailVerified()) {
            log.info("Login attempt with unverified email: {}", request.getEmail());
            throw new AuthException("Tài khoản chưa được xác thực. Vui lòng đăng ký lại để nhận mã xác thực mới.");
        }

        // Check if account is active and enabled
        if (!user.getIsActive() || !user.isEnabled()) {
            log.warn("Login attempt with inactive/disabled account: {}", request.getEmail());
            throw new AuthException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        // Update authType if user previously only used Google
        if (user.getAuthType() == www.model.enums.AuthProviderType.GOOGLE) {
            user.setAuthType(www.model.enums.AuthProviderType.BOTH);
            userService.updateUser(user);
            log.info("Updated authType to BOTH for user: {}", user.getEmail());
        }

        try {
            // Create session
            String userAgent = httpRequest.getHeader("User-Agent");
            String ip = getClientIpAddress(httpRequest);
            String sessionId = sessionService.createSession(user.getUserId(), userAgent, ip);
            issueAuthTokens(user, sessionId, httpResponse);

            // Create user response
            UserResponse userResponse = UserResponse.builder()
                    .id(user.getUserId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .avatar(user.getAvatar())
                    .role(user.getRole())
                    .authType(user.getAuthType())
                    .googleAuth(user.getGoogleAuth())
                    .enabled(user.getIsActive())
                    .build();

            log.info("User logged in successfully: {}", request.getEmail());
            return AuthResponse.builder()
                    .user(userResponse)
                    .build();

        } catch (Exception e) {
            log.error("Login failed for email: {}", request.getEmail(), e);
            throw new AuthException("Đăng nhập thất bại: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public AuthResponse refresh(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        try {
            // Get refresh token from cookie
            String refreshToken = getRefreshTokenFromCookie(httpRequest);
            if (refreshToken == null) {
                throw new AuthException("Refresh token không tìm thấy trong cookies");
            }

            // Validate refresh token (JWT-based validation)
            if (!sessionService.validateRefreshToken(refreshToken)) {
                throw new AuthException("token sai hoặc hết hạn");
            }

            // Extract userId and sessionId from refresh token
            String userId = jwtService.getUserIdFromToken(refreshToken);
            String sessionId = jwtService.getSessionIdFromRefreshToken(refreshToken);

            // Get user
            User user = userService.findById(userId)
                    .orElseThrow(() -> new AuthException("Không tìm thấy người dùng"));

            // Check if account is active
            if (!user.getIsActive() || !user.isEnabled()) {
                log.warn("Refresh token attempt with inactive/disabled account: {}", userId);
                throw new AuthException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
            }

            String accessToken = jwtService.generateAccessToken(
                    user.getUserId(), user.getEmail(), user.getRole(), sessionId);
            sessionService.bindAccessToken(userId, sessionId, accessToken);
            setAccessTokenCookie(httpResponse, accessToken);

            // Create user response
            UserResponse userResponse = UserResponse.builder()
                    .id(user.getUserId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .avatar(user.getAvatar())
                    .role(user.getRole())
                    .authType(user.getAuthType())
                    .googleAuth(user.getGoogleAuth())
                    .enabled(user.getIsActive())
                    .build();

            log.info("Token refreshed successfully for user: {}", userId);
            return AuthResponse.builder()
                    .user(userResponse)
                    .build();

        } catch (Exception e) {
            log.error("Token refresh failed", e);
            throw new AuthException("Làm mới token thất bại: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void logout(HttpServletRequest httpRequest, String userId, HttpServletResponse httpResponse) {
        try {
            String refreshToken = getRefreshTokenFromCookie(httpRequest);
            if (refreshToken != null) {
                try {
                    String sessionId = jwtService.getSessionIdFromRefreshToken(refreshToken);
                    sessionService.deleteSession(userId, sessionId);
                } catch (Exception e) {
                    log.warn("Could not extract session ID from refresh token during logout: {}", e.getMessage());
                }
            }

            clearAccessTokenCookie(httpResponse);
            clearRefreshTokenCookie(httpResponse);

            log.info("User logged out successfully: {}", userId);
        } catch (Exception e) {
            log.error("Logout failed for user: {}", userId, e);
            throw new RuntimeException("Đăng xuất thất bại", e);
        }
    }

    @Override
    public UserResponse getCurrentUser(String userId) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return UserResponse.builder()
                .id(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .gender(user.getGender())
                .avatar(user.getAvatar())
                .dateOfBirth(user.getDateOfBirth())
                .authType(user.getAuthType())
                .googleAuth(user.getGoogleAuth())
                .enabled(user.isEnabled())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
        // Không trả về password để bảo vệ thông tin nhạy cảm
    }

    private void issueAuthTokens(User user, String sessionId, HttpServletResponse httpResponse) {
        String accessToken = jwtService.generateAccessToken(
                user.getUserId(), user.getEmail(), user.getRole(), sessionId);
        sessionService.bindAccessToken(user.getUserId(), sessionId, accessToken);
        setAccessTokenCookie(httpResponse, accessToken);
        String refreshToken = sessionService.getRefreshToken(user.getUserId(), sessionId);
        setRefreshTokenCookie(httpResponse, refreshToken);
    }

    private void setAccessTokenCookie(HttpServletResponse response, String accessToken) {
        Cookie cookie = new Cookie("access_token", accessToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(15 * 60); // 15 minutes
        cookie.setAttribute("SameSite", "Lax"); // For localhost development
        response.addCookie(cookie);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        cookie.setAttribute("SameSite", "Lax"); // For localhost development
        response.addCookie(cookie);
    }

    private void clearAccessTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("access_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refresh_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private String getAccessTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    // Password management methods
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Check if user exists
        User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Email not found"));

        // Check if account is active
        if (!user.getIsActive() || !user.isEnabled()) {
            log.warn("Forgot password attempt with inactive/disabled account: {}", request.getEmail());
            throw new AuthException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        try {
            // Generate and save OTP
            String otp = otpService.generateOtp();
            otpService.saveOtp(request.getEmail(), otp);

            // Send reset password email
            mailService.sendResetPasswordMail(request.getEmail(), otp);

            log.info("Reset password OTP sent to email: {}", request.getEmail());

        } catch (Exception e) {
            log.error("Failed to send reset password OTP for email: {}", request.getEmail(), e);
            throw new AuthException("Gửi OTP cài lại mật khẩu thất bại : " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AuthException("Mật khẩu không khớp");
        }

        // Get email from OTP
        String email = otpService.getEmailByOtp(request.getOtp())
                .orElseThrow(() -> new AuthException("token sai hoặc hết hạn"));

        // Validate OTP (this will also delete the OTP)
        if (!otpService.validateOtp(email, request.getOtp())) {
            throw new AuthException("token sai hoặc hết hạn");
        }

        // Find user
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new AuthException("Không tìm thấy người dùng"));

        try {
            // Update password
            userService.changePassword(user.getUserId(), request.getNewPassword());

            // Invalidate all existing sessions for this user
            sessionService.deleteAllUserSessions(user.getUserId());

            log.info("Password reset successfully for email: {}", email);

        } catch (Exception e) {
            log.error("Password reset failed for email: {}", email, e);
            throw new AuthException("Cài lại mật khẩu thất bại: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AuthException("Mật khẩu không khớp");
        }

        // Find user
        User user = userService.findById(userId)
                .orElseThrow(() -> new AuthException("Không tìm thấy người dùng"));

        // Validate current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AuthException("Mật khẩu hiện tại không chính xác");
        }

        // Check if new password is different from current
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AuthException("Mật khẩu mới phải khác với mật khẩu hiện tại");
        }

        try {
            // Update password
            userService.changePassword(userId, request.getNewPassword());

            // Invalidate all other sessions for this user (keep current session)
            sessionService.deleteAllUserSessions(userId);

            log.info("Password changed successfully for user: {}", userId);

        } catch (Exception e) {
            log.error("Password change failed for user: {}", userId, e);
            throw new AuthException("Đổi mật khẩu thất bại: " + e.getMessage(), e);
        }
    }

    // Profile management methods
    @Override
    @Transactional
    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        try {
            User updatedUser = userService.updateProfile(userId, request);

            return UserResponse.builder()
                    .id(updatedUser.getUserId())
                    .email(updatedUser.getEmail())
                    .fullName(updatedUser.getFullName())
                    .phone(updatedUser.getPhone())
                    .gender(updatedUser.getGender())
                    .avatar(updatedUser.getAvatar())
                    .dateOfBirth(updatedUser.getDateOfBirth())
                    .authType(updatedUser.getAuthType())
                    .googleAuth(updatedUser.getGoogleAuth())
                    .role(updatedUser.getRole())
                    .enabled(updatedUser.isEnabled())
                    .isActive(updatedUser.getIsActive())
                    .isEmailVerified(updatedUser.getIsEmailVerified())
                    .lastLoginAt(updatedUser.getLastLoginAt())
                    .createdAt(updatedUser.getCreatedAt())
                    .updatedAt(updatedUser.getUpdatedAt())
                    .build();

        } catch (Exception e) {
            log.error("Profile update failed for user: {}", userId, e);
            throw new AuthException("Cập nhật hồ sơ thất bại: " + e.getMessage(), e);
        }
    }

    // Google OAuth2 authentication
    @Override
    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        try {
            // Verify Google ID token
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), 
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                throw new AuthException("Token Google không hợp lệ");
            }

            // Extract user info from token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");
            String googleId = payload.getSubject();
            boolean emailVerified = payload.getEmailVerified();

            if (!emailVerified) {
                throw new AuthException("Email Google chưa được xác thực");
            }

            // Create GoogleAuth object
            GoogleAuth googleAuth = GoogleAuth.builder()
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .connectedAt(LocalDateTime.now().toString())
                    .build();

            // Create or update user
            User user = userService.createOrUpdateGoogleUser(email, name, picture, googleAuth);

            // Check if account is active
            if (!user.getIsActive() || !user.isEnabled()) {
                log.warn("Google auth attempt with inactive/disabled account: {}", user.getEmail());
                throw new AuthException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
            }

            // Create session
            String userAgent = httpRequest.getHeader("User-Agent");
            String ip = getClientIpAddress(httpRequest);
            String sessionId = sessionService.createSession(user.getUserId(), userAgent, ip);
            issueAuthTokens(user, sessionId, httpResponse);

            // Create user response
            UserResponse userResponse = UserResponse.builder()
                    .id(user.getUserId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .avatar(user.getAvatar())
                    .role(user.getRole())
                    .authType(user.getAuthType())
                    .googleAuth(user.getGoogleAuth())
                    .enabled(user.getIsActive())
                    .build();

            log.info("Google authentication successful for email: {}", email);
            return AuthResponse.builder()
                    .user(userResponse)
                    .build();

        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google authentication failed", e);
            throw new AuthException("Xác thực Google thất bại: " + e.getMessage(), e);
        }
    }
}