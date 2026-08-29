package www.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import www.model.entity.User;
import www.model.enums.AuthProviderType;
import www.model.enums.UserRole;
import www.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSeedService {

    private static final String SEED_EMAIL_DOMAIN = "@sole.test";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${user.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${user.seed.password:Sole@123}")
    private String seedPassword;

    @PostConstruct
    public void seedUsersIfMissing() {
        if (!seedEnabled) {
            log.info("User seed disabled");
            return;
        }
        try {
            List<SeedUser> created = seedUsers();
            if (created.isEmpty()) {
                log.info("User seed skipped — demo accounts already exist ({})", seedEmailDomainSummary());
                return;
            }
            log.info("User seed complete — {} demo account(s) created", created.size());
            logSeedCredentials(created);
        } catch (DataAccessException e) {
            log.warn("Skip user seed because database is not ready: {}", e.getMessage());
        }
    }

    private List<SeedUser> seedUsers() {
        LocalDateTime now = LocalDateTime.now();
        String encodedPassword = passwordEncoder.encode(seedPassword);
        List<SeedDefinition> definitions = List.of(
                def("customer@sole.test", "Khách hàng Demo", UserRole.CUSTOMER,
                        "Mua hàng, giỏ hàng, checkout, đơn hàng, wishlist"),
                def("customer2@sole.test", "Khách hàng 2", UserRole.CUSTOMER,
                        "Tài khoản customer thứ hai để test song song"),
                def("staff@sole.test", "Nhân viên Demo", UserRole.STAFF,
                        "Portal /staff — sản phẩm, tồn kho, đơn hàng, trả hàng"),
                def("manager@sole.test", "Quản lý Shop", UserRole.SHOP_MANAGER,
                        "Portal /staff + quyền publish sản phẩm (BE)"),
                def("admin@sole.test", "Admin Demo", UserRole.ADMIN,
                        "Portal /admin — quản trị đầy đủ trừ RBAC matrix"),
                def("superadmin@sole.test", "Super Admin", UserRole.SUPER_ADMIN,
                        "Portal /admin + phân quyền RBAC, toàn quyền hệ thống")
        );

        List<SeedUser> created = new ArrayList<>();
        for (SeedDefinition definition : definitions) {
            if (userRepository.existsByEmail(definition.email())) {
                continue;
            }
            userRepository.save(User.builder()
                    .email(definition.email())
                    .fullName(definition.fullName())
                    .password(encodedPassword)
                    .authType(AuthProviderType.LOCAL)
                    .role(definition.role())
                    .enabled(true)
                    .isActive(true)
                    .isEmailVerified(true)
                    .phone(definition.phone())
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            created.add(new SeedUser(definition.email(), definition.role(), definition.note()));
        }
        return created;
    }

    private void logSeedCredentials(List<SeedUser> created) {
        log.info("============================================================");
        log.info("SOLE demo accounts (password for all: {})", seedPassword);
        for (SeedUser user : created) {
            log.info("  {} | {} | {}", padRole(user.role()), user.email(), user.note());
        }
        log.info("============================================================");
    }

    private String seedEmailDomainSummary() {
        return "*" + SEED_EMAIL_DOMAIN;
    }

    private static SeedDefinition def(String email, String fullName, UserRole role, String note) {
        return new SeedDefinition(email, fullName, role, phoneFor(email), note);
    }

    private static String phoneFor(String email) {
        return switch (email) {
            case "customer@sole.test" -> "0901000001";
            case "customer2@sole.test" -> "0901000002";
            case "staff@sole.test" -> "0902000001";
            case "manager@sole.test" -> "0903000001";
            case "admin@sole.test" -> "0904000001";
            case "superadmin@sole.test" -> "0905000001";
            default -> "0900000000";
        };
    }

    private static String padRole(UserRole role) {
        return String.format("%-12s", role.name());
    }

    private record SeedDefinition(
            String email,
            String fullName,
            UserRole role,
            String phone,
            String note) {
    }

    private record SeedUser(String email, UserRole role, String note) {
    }
}
