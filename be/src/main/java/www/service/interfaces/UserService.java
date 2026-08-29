package www.service.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import www.model.dto.request.UpdateProfileRequest;
import www.model.dto.request.UpdateUserRequest;
import www.model.entity.GoogleAuth;
import www.model.entity.User;
import www.model.enums.UserRole;

import java.util.List;
import java.util.Optional;

public interface UserService {
    User createUser(String email, String fullName, String password);
    Optional<User> findByEmail(String email);
    Optional<User> findById(String id);
    boolean existsByEmail(String email);
    User enableUser(String email);
    User updateUser(User user);
    User updateProfile(String userId, UpdateProfileRequest request);
    void changePassword(String userId, String newPassword);
    User updateUnverifiedUser(String email, String fullName, String newPassword);
    User createOrUpdateGoogleUser(String email, String fullName, String picture, GoogleAuth googleAuth);
    
    // Admin user management methods
    List<User> getAllUsers();
    Page<User> getAllUsers(Pageable pageable);
    Page<User> getAllUsers(Pageable pageable, String search, UserRole role, Boolean isActive);
    User getUserById(String userId);
    User updateUserByAdmin(String userId, UpdateUserRequest request);
    User toggleUserStatus(String userId);
}