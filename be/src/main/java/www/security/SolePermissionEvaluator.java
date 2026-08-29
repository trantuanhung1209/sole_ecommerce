package www.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import www.modules.rbac.service.RbacService;
import www.security.CustomUserDetailsService.UserPrincipal;

@Component("perm")
@RequiredArgsConstructor
public class SolePermissionEvaluator {

    private final RbacService rbacService;

    @Value("${permission.enforcement:true}")
    private boolean enforcementEnabled;

    public boolean has(Authentication authentication, String permission) {
        if (!enforcementEnabled) {
            return true;
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal user)) {
            return false;
        }
        String role = user.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("CUSTOMER");
        return rbacService.hasPermission(role, permission);
    }
}
