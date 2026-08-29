package www.service.implement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import www.model.dto.request.UpdateProfileRequest;
import www.model.dto.request.UpdateUserRequest;
import www.model.entity.GoogleAuth;
import www.model.entity.User;
import www.model.enums.AuthProviderType;
import www.model.enums.UserRole;
import www.repository.UserRepository;
import www.service.interfaces.CloudinaryService;
import www.service.interfaces.UserService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final MongoTemplate mongoTemplate;

    @Override
    public User createUser(String email, String fullName, String password) {
        if (existsByEmail(email)) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .password(passwordEncoder.encode(password))
                .authType(AuthProviderType.LOCAL)
                .isActive(false)
                .role(UserRole.CUSTOMER)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Created new user with email: {}", email);
        return savedUser;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User enableUser(String email) {
        User user = findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        user.setIsActive(true);
        user.setIsEmailVerified(true);
        user.setEnabled(true);
        user.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        log.info("Enabled user with email: {}", email);
        return savedUser;
    }

    @Override
    public User updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    public User updateProfile(String userId, UpdateProfileRequest request) {
        User user = findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Update only non-null fields
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        }
//        if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
//            user.set(request.getAddress().trim());
//        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
//        if (request.getIdentityNumber() != null && !request.getIdentityNumber().trim().isEmpty()) {
//            user.setIdentityNumber(request.getIdentityNumber().trim());
//        }

        // Handle avatar upload to Cloudinary
        if (request.getAvatar() != null && !request.getAvatar().trim().isEmpty()) {
            try {
                log.info("Uploading avatar to Cloudinary for user: {}", userId);
                String avatarUrl = cloudinaryService.uploadImageToFolder(
                    request.getAvatar(), 
                    "ecommerce/avatars"
                );
                user.setAvatar(avatarUrl);
                log.info("Avatar uploaded successfully: {}", avatarUrl);
            } catch (Exception e) {
                log.error("Failed to upload avatar for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Lỗi khi upload ảnh đại diện: " + e.getMessage());
            }
        }

        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        log.info("Updated profile for user: {}", userId);
        return savedUser;
    }

    @Override
    public void changePassword(String userId, String newPassword) {
        User user = findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Changed password for user: {}", userId);
    }

    @Override
    public User updateUnverifiedUser(String email, String fullName, String newPassword) {
        User user = findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        // Update user info and password
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        
        // Ensure authType is set to LOCAL if not already set
        if (user.getAuthType() == null) {
            user.setAuthType(AuthProviderType.LOCAL);
        }
        
        User savedUser = userRepository.save(user);
        log.info("Updated unverified user: {}", email);
        return savedUser;
    }

    @Override
    public User createOrUpdateGoogleUser(String email, String fullName, String picture, GoogleAuth googleAuth) {
        Optional<User> existingUser = findByEmail(email);
        
        if (existingUser.isPresent()) {
            // Update existing user with Google info
            User user = existingUser.get();
            
            // Update auth type if needed
            if (user.getAuthType() == AuthProviderType.LOCAL) {
                user.setAuthType(AuthProviderType.BOTH);
            } else if (user.getAuthType() == null) {
                user.setAuthType(AuthProviderType.GOOGLE);
            }
            
            // Update Google auth info
            user.setGoogleAuth(googleAuth);
            
            // Only set avatar from Google if user doesn't have a custom avatar
            // Priority: user's uploaded avatar > Google picture
            if ((user.getAvatar() == null || user.getAvatar().isEmpty()) && picture != null && !picture.isEmpty()) {
                user.setAvatar(picture);
            }
            
            // Update email verification status (Google email is always verified)
            user.setIsEmailVerified(true);
            user.setLastLoginAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            
            User savedUser = userRepository.save(user);
            log.info("Updated existing user with Google auth: {}", email);
            return savedUser;
            
        } else {
            // Create new user with Google auth
            User newUser = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .avatar(picture)
                    .authType(AuthProviderType.GOOGLE)
                    .googleAuth(googleAuth)
                    .isActive(true)
                    .isEmailVerified(true)
                    .enabled(true)
                    .role(UserRole.CUSTOMER)
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            
            User savedUser = userRepository.save(newUser);
            log.info("Created new user with Google auth: {}", email);
            return savedUser;
        }
    }

    @Override
    public List<User> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll();
    }

    @Override
    public Page<User> getAllUsers(Pageable pageable) {
        return getAllUsers(pageable, null, null, null);
    }

    @Override
    public Page<User> getAllUsers(Pageable pageable, String search, UserRole role, Boolean isActive) {
        log.info("Fetching users with filters - search: {}, role: {}, isActive: {}", search, role, isActive);
        Query query = new Query();
        if (search != null && !search.isBlank()) {
            String keyword = search.trim();
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("fullName").regex(keyword, "i"),
                    Criteria.where("email").regex(keyword, "i"),
                    Criteria.where("phone").regex(keyword, "i")
            ));
        }
        if (role != null) {
            query.addCriteria(Criteria.where("role").is(role));
        }
        if (isActive != null) {
            query.addCriteria(Criteria.where("isActive").is(isActive));
        }
        long total = mongoTemplate.count(query, User.class);
        query.with(pageable);
        List<User> users = mongoTemplate.find(query, User.class);
        return new PageImpl<>(users, pageable, total);
    }

    @Override
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
    }

    @Override
    public User updateUserByAdmin(String userId, UpdateUserRequest request) {
        User user = getUserById(userId);

        // Cannot update ADMIN users
        if (user.getRole() == UserRole.ADMIN) {
            throw new RuntimeException("Không thể chỉnh sửa thông tin của Admin khác");
        }

        // Update fields if provided
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        if (request.getDateOfBirth() != null && !request.getDateOfBirth().trim().isEmpty()) {
            try {
                user.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
            } catch (Exception e) {
                log.error("Invalid date format: {}", request.getDateOfBirth());
                throw new RuntimeException("Định dạng ngày sinh không hợp lệ");
            }
        }

        // Staff roles require a phone number
        if (request.getRole() != null) {
            if (request.getRole() == UserRole.STAFF || request.getRole() == UserRole.SHOP_MANAGER) {
                // Check if phone exists (either from request or already in user)
                String phone = request.getPhone() != null && !request.getPhone().trim().isEmpty() 
                    ? request.getPhone().trim() 
                    : user.getPhone();
                
                if (phone == null || phone.trim().isEmpty()) {
                    throw new RuntimeException("Số điện thoại là bắt buộc khi nâng quyền lên Nhân viên");
                }
            }
            user.setRole(request.getRole());
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        log.info("Admin updated user: {}", userId);
        return savedUser;
    }

    @Override
    public User toggleUserStatus(String userId) {
        User user = getUserById(userId);

        // Cannot disable ADMIN users
        if (user.getRole() == UserRole.ADMIN) {
            throw new RuntimeException("Không thể vô hiệu hóa tài khoản ADMIN");
        }

        // Toggle both isActive and enabled status
        boolean newStatus = !user.getIsActive();
        user.setIsActive(newStatus);
        user.setEnabled(newStatus);
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        log.info("Toggled user {} active status to: {}", userId, savedUser.getIsActive());
        return savedUser;
    }
}