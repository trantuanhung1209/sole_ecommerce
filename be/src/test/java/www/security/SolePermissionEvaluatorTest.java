package www.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import www.model.enums.UserRole;
import www.modules.rbac.service.RbacService;
import www.security.CustomUserDetailsService.UserPrincipal;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolePermissionEvaluatorTest {

    @Mock
    private RbacService rbacService;

    @InjectMocks
    private SolePermissionEvaluator evaluator;

    private UsernamePasswordAuthenticationToken staffAuth;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(evaluator, "enforcementEnabled", true);
        UserPrincipal principal = new UserPrincipal(
                "u1", "staff@test.com", "Staff User", "hash", true, UserRole.STAFF,
                List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        staffAuth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    void has_returnsTrueWhenEnforcementDisabled() {
        ReflectionTestUtils.setField(evaluator, "enforcementEnabled", false);
        assertTrue(evaluator.has(null, "ORDER_UPDATE"));
    }

    @Test
    void has_falseWhenUnauthenticated() {
        assertFalse(evaluator.has(null, "ORDER_UPDATE"));
    }

    @Test
    void has_delegatesToRbacService() {
        when(rbacService.hasPermission("STAFF", "ORDER_UPDATE")).thenReturn(true);
        assertTrue(evaluator.has(staffAuth, "ORDER_UPDATE"));
        verify(rbacService).hasPermission("STAFF", "ORDER_UPDATE");
    }

    @Test
    void has_falseForUnknownPrincipal() {
        UsernamePasswordAuthenticationToken badAuth =
                new UsernamePasswordAuthenticationToken("anonymous", null);
        assertFalse(evaluator.has(badAuth, "ORDER_UPDATE"));
    }
}
