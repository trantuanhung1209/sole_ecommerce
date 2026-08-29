package www.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import www.model.dto.request.*;
import www.model.dto.response.ApiResponse;
import www.model.dto.response.AuthResponse;
import www.model.dto.response.SessionResponse;
import www.model.dto.response.UserResponse;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.service.interfaces.AuthService;
import www.service.interfaces.JwtService;
import www.service.interfaces.SessionService;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    private final SessionService sessionService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());
        try {
            authService.register(request);
            return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công. Vui lòng kiểm tra email để xác thực OTP."));
        } catch (Exception e) {
            log.error("Registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        log.info("OTP verification attempt for email: {}", request.getEmail());
        try {
            AuthResponse response = authService.verifyOtp(request, httpRequest, httpResponse);
            return ResponseEntity.ok(ApiResponse.success("Xác thực tài khoản thành công", response));
        } catch (Exception e) {
            log.error("OTP verification failed for email: {}", request.getEmail(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        log.info("Login attempt for email: {}", request.getEmail());
        try {
            AuthResponse response = authService.login(request, httpRequest, httpResponse);
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
        } catch (Exception e) {
            log.error("Login failed for email: {}", request.getEmail(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        log.info("Token refresh attempt");
        try {
            AuthResponse response = authService.refresh(httpRequest, httpResponse);
            return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletResponse httpResponse) {
        
        try {
            log.info("Logout attempt for user: {}", userPrincipal.getId());
            authService.logout(httpRequest, userPrincipal.getId(), httpResponse);
            return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công"));
        } catch (Exception e) {
            log.error("Logout failed for user: {}", userPrincipal.getId(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Đăng xuất thất bại"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        try {
            log.info("Get current user info for user: {}", userPrincipal.getId());
            UserResponse response = authService.getCurrentUser(userPrincipal.getId());
            return ResponseEntity.ok(ApiResponse.success("Đã lấy thông tin người dùng thành công", response));
        } catch (Exception e) {
            log.error("Failed to get current user info for user: {}", userPrincipal.getId(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Lấy thông tin thất bại"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password request for email: {}", request.getEmail());
        try {
            authService.forgotPassword(request);
            return ResponseEntity.ok(ApiResponse.success("Đã gửi OTP cài lại mật khẩu đến email"));
        } catch (Exception e) {
            log.error("Forgot password failed for email: {}", request.getEmail(), e);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password request with OTP");
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(ApiResponse.success("Mật khẩu cài đặt lại thành công"));
        } catch (Exception e) {
            log.error("Reset password failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        try {
            log.info("Change password request for user: {}", userPrincipal.getId());
            authService.changePassword(userPrincipal.getId(), request);
            return ResponseEntity.ok(ApiResponse.success("Mật khẩu thay đổi thành công"));
        } catch (Exception e) {
            log.error("Change password failed for user: {}", userPrincipal.getId(), e);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        try {
            log.info("Update profile request for user: {}", userPrincipal.getId());
            UserResponse response = authService.updateProfile(userPrincipal.getId(), request);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", response));
        } catch (Exception e) {
            log.error("Update profile failed for user: {}", userPrincipal.getId(), e);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        log.info("Google authentication attempt");
        try {
            AuthResponse response = authService.googleAuth(request, httpRequest, httpResponse);
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập với Google thành công", response));
        } catch (Exception e) {
            log.error("Google authentication failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listSessions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest httpRequest) {
        String currentSessionId = extractSessionId(httpRequest);
        return ResponseEntity.ok(ApiResponse.success(
                sessionService.listSessions(userPrincipal.getId(), currentSessionId)));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        sessionService.deleteSession(userPrincipal.getId(), sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session revoked"));
    }

    @DeleteMapping("/sessions")
    public ResponseEntity<ApiResponse<Void>> deleteAllSessions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest httpRequest) {
        String currentSessionId = extractSessionId(httpRequest);
        for (SessionResponse session : sessionService.listSessions(userPrincipal.getId(), currentSessionId)) {
            if (!session.isCurrent()) {
                sessionService.deleteSession(userPrincipal.getId(), session.getSessionId());
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Other sessions revoked"));
    }

    private String extractSessionId(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (var cookie : request.getCookies()) {
            if ("refresh_token".equals(cookie.getName()) || "refreshToken".equals(cookie.getName())) {
                try {
                    return jwtService.getSessionIdFromRefreshToken(cookie.getValue());
                } catch (Exception ignored) {
                    return null;
                }
            }
        }
        return null;
    }
}