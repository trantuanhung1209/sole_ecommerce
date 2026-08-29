package www.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import www.model.dto.common.PageResponse;
import www.model.dto.request.UpdateUserRequest;
import www.model.dto.response.ApiResponse;
import www.model.dto.response.UserResponse;
import www.model.entity.User;
import www.model.enums.UserRole;
import www.service.interfaces.UserService;
import www.util.PageUtils;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final UserService userService;

    /**
     * Get all users in the system with pagination
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean isActive) {
        log.info("Admin fetching all users - page: {}, size: {}", page, size);
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") 
                    ? Sort.by(sortBy).descending() 
                    : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<User> userPage = userService.getAllUsers(pageable, search, role, isActive);
            List<UserResponse> userResponses = userPage.getContent().stream()
                    .map(this::convertToUserResponse)
                    .collect(Collectors.toList());
            
            Page<UserResponse> responsePage = userPage.map(this::convertToUserResponse);
            PageResponse<UserResponse> pageResponse = PageUtils.toPageResponse(responsePage);

            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", pageResponse));
        } catch (Exception e) {
            log.error("Error fetching all users", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get user by ID
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String userId) {
        log.info("Admin fetching user with ID: {}", userId);
        try {
            User user = userService.getUserById(userId);
            UserResponse userResponse = convertToUserResponse(user);
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", userResponse));
        } catch (Exception e) {
            log.error("Error fetching user by ID: {}", userId, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Update user information
     */
    @PutMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("Admin updating user: {}", userId);
        try {
            User updatedUser = userService.updateUserByAdmin(userId, request);
            UserResponse userResponse = convertToUserResponse(updatedUser);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin người dùng thành công", userResponse));
        } catch (Exception e) {
            log.error("Error updating user: {}", userId, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Toggle user active status (enable/disable account)
     * Cannot disable ADMIN accounts
     */
    @PatchMapping("/users/{userId}/toggle-status")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(@PathVariable String userId) {
        log.info("Admin toggling status for user: {}", userId);
        try {
            User updatedUser = userService.toggleUserStatus(userId);
            UserResponse userResponse = convertToUserResponse(updatedUser);
            String message = updatedUser.getIsActive() 
                    ? "Đã kích hoạt tài khoản người dùng" 
                    : "Đã vô hiệu hóa tài khoản người dùng";
            return ResponseEntity.ok(ApiResponse.success(message, userResponse));
        } catch (Exception e) {
            log.error("Error toggling user status: {}", userId, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Convert User entity to UserResponse DTO
     */
    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .avatar(user.getAvatar())
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
    }
}
