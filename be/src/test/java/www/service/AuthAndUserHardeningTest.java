package www.service;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import www.model.dto.request.LoginRequest;
import www.model.entity.User;
import www.model.enums.AuthProviderType;
import www.model.enums.UserRole;
import www.modules.cart.service.GuestCartMergeService;
import www.modules.cart.support.GuestCartSupport;
import www.modules.rbac.service.RbacService;
import www.repository.UserRepository;
import www.service.implement.AuthServiceImpl;
import www.service.implement.UserServiceImpl;
import www.service.interfaces.CloudinaryService;
import www.service.interfaces.JwtService;
import www.service.interfaces.MailService;
import www.service.interfaces.OtpService;
import www.service.interfaces.SessionService;
import www.service.interfaces.UserService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthAndUserHardeningTest {

    @Mock
    private UserService userService;
    @Mock
    private OtpService otpService;
    @Mock
    private JwtService jwtService;
    @Mock
    private SessionService sessionService;
    @Mock
    private MailService mailService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RbacService rbacService;
    @Mock
    private GuestCartMergeService guestCartMergeService;
    @Mock
    private GuestCartSupport guestCartSupport;

    @Mock
    private UserRepository userRepository;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private AuthServiceImpl authService;

    @InjectMocks
    private UserServiceImpl userServiceImpl;

    @Test
    void loginUsesSafeCookieDefaultsUnderInjectMocks() {
        User user = activeCustomer();
        stubSuccessfulLogin(user);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        authService.login(loginRequest(), request, response);

        Cookie accessCookie = response.getCookie("access_token");
        Cookie refreshCookie = response.getCookie("refresh_token");
        assertThat(accessCookie).isNotNull();
        assertThat(accessCookie.isHttpOnly()).isTrue();
        assertThat(accessCookie.getSecure()).isFalse();
        assertThat(accessCookie.getAttribute("SameSite")).isEqualTo("Lax");
        assertThat(accessCookie.getMaxAge()).isEqualTo(15 * 60);

        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getSecure()).isFalse();
        assertThat(refreshCookie.getAttribute("SameSite")).isEqualTo("Lax");
        assertThat(refreshCookie.getMaxAge()).isEqualTo(7 * 24 * 60 * 60);
    }

    @Test
    void authCookiesRespectCookieSecureTrueAndSameSiteNoneAcrossLoginRefreshAndLogout() {
        ReflectionTestUtils.setField(authService, "cookieSecure", true);
        ReflectionTestUtils.setField(authService, "cookieSameSite", "None");

        User user = activeCustomer();
        stubSuccessfulLogin(user);

        MockHttpServletRequest loginReq = new MockHttpServletRequest();
        MockHttpServletResponse loginRes = new MockHttpServletResponse();
        authService.login(loginRequest(), loginReq, loginRes);

        Cookie loginAccess = loginRes.getCookie("access_token");
        Cookie loginRefresh = loginRes.getCookie("refresh_token");
        assertThat(loginAccess).isNotNull();
        assertThat(loginAccess.getSecure()).isTrue();
        assertThat(loginAccess.isHttpOnly()).isTrue();
        assertThat(loginAccess.getAttribute("SameSite")).isEqualTo("None");

        assertThat(loginRefresh).isNotNull();
        assertThat(loginRefresh.getSecure()).isTrue();
        assertThat(loginRefresh.isHttpOnly()).isTrue();
        assertThat(loginRefresh.getAttribute("SameSite")).isEqualTo("None");

        // Refresh
        when(sessionService.validateRefreshToken("refresh-tok")).thenReturn(true);
        when(jwtService.getUserIdFromToken("refresh-tok")).thenReturn("u-cust-1");
        when(jwtService.getSessionIdFromRefreshToken("refresh-tok")).thenReturn("sess-1");
        when(userService.findById("u-cust-1")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken("u-cust-1", "cust@sole.test", UserRole.CUSTOMER, "sess-1"))
                .thenReturn("access-tok-2");

        MockHttpServletRequest refreshReq = new MockHttpServletRequest();
        refreshReq.setCookies(new Cookie("refresh_token", "refresh-tok"));
        MockHttpServletResponse refreshRes = new MockHttpServletResponse();
        authService.refresh(refreshReq, refreshRes);

        Cookie refreshedAccess = refreshRes.getCookie("access_token");
        assertThat(refreshedAccess).isNotNull();
        assertThat(refreshedAccess.getSecure()).isTrue();
        assertThat(refreshedAccess.isHttpOnly()).isTrue();
        assertThat(refreshedAccess.getAttribute("SameSite")).isEqualTo("None");
        assertThat(refreshedAccess.getValue()).isEqualTo("access-tok-2");

        // Logout
        MockHttpServletRequest logoutReq = new MockHttpServletRequest();
        logoutReq.setCookies(new Cookie("refresh_token", "refresh-tok"));
        MockHttpServletResponse logoutRes = new MockHttpServletResponse();
        authService.logout(logoutReq, "u-cust-1", logoutRes);

        Cookie clearedAccess = logoutRes.getCookie("access_token");
        Cookie clearedRefresh = logoutRes.getCookie("refresh_token");
        assertThat(clearedAccess).isNotNull();
        assertThat(clearedAccess.getMaxAge()).isZero();
        assertThat(clearedAccess.getSecure()).isTrue();
        assertThat(clearedAccess.isHttpOnly()).isTrue();
        assertThat(clearedAccess.getAttribute("SameSite")).isEqualTo("None");

        assertThat(clearedRefresh).isNotNull();
        assertThat(clearedRefresh.getMaxAge()).isZero();
        assertThat(clearedRefresh.getSecure()).isTrue();
        assertThat(clearedRefresh.isHttpOnly()).isTrue();
        assertThat(clearedRefresh.getAttribute("SameSite")).isEqualTo("None");
        verify(sessionService).deleteSession("u-cust-1", "sess-1");
    }

    @Test
    void toggleUserStatusRejectsSuperAdminAndAdminWithoutSavingOrRevoking() {
        User superAdmin = User.builder()
                .userId("u-sa-1")
                .email("superadmin@sole.test")
                .role(UserRole.SUPER_ADMIN)
                .isActive(true)
                .enabled(true)
                .build();
        User admin = User.builder()
                .userId("u-adm-1")
                .email("admin@sole.test")
                .role(UserRole.ADMIN)
                .isActive(true)
                .enabled(true)
                .build();

        when(userRepository.findById("u-sa-1")).thenReturn(Optional.of(superAdmin));
        when(userRepository.findById("u-adm-1")).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> userServiceImpl.toggleUserStatus("u-sa-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("SUPER_ADMIN");
        assertThatThrownBy(() -> userServiceImpl.toggleUserStatus("u-adm-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ADMIN");

        verify(userRepository, never()).save(any());
        verify(sessionService, never()).deleteAllUserSessions(anyString());
    }

    @Test
    void toggleUserStatusRevokesSessionsOnlyWhenDisablingUser() {
        User activeCustomer = User.builder()
                .userId("u-cust-1")
                .email("cust@sole.test")
                .role(UserRole.CUSTOMER)
                .isActive(true)
                .enabled(true)
                .build();
        when(userRepository.findById("u-cust-1")).thenReturn(Optional.of(activeCustomer));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User disabled = userServiceImpl.toggleUserStatus("u-cust-1");
        assertThat(disabled.getIsActive()).isFalse();
        assertThat(disabled.isEnabled()).isFalse();
        verify(sessionService).deleteAllUserSessions("u-cust-1");

        // Re-enabling should NOT revoke sessions
        User reEnabled = userServiceImpl.toggleUserStatus("u-cust-1");
        assertThat(reEnabled.getIsActive()).isTrue();
        assertThat(reEnabled.isEnabled()).isTrue();
        verify(sessionService).deleteAllUserSessions("u-cust-1"); // still called only once total
    }

    private void stubSuccessfulLogin(User user) {
        when(userService.findByEmail("cust@sole.test")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Secret123!", "encoded-pw")).thenReturn(true);
        when(sessionService.createSession(anyString(), any(), any())).thenReturn("sess-1");
        when(jwtService.generateAccessToken("u-cust-1", "cust@sole.test", UserRole.CUSTOMER, "sess-1"))
                .thenReturn("access-tok");
        when(sessionService.getRefreshToken("u-cust-1", "sess-1")).thenReturn("refresh-tok");
        when(guestCartSupport.resolveGuestSessionId(any())).thenReturn(null);
    }

    private LoginRequest loginRequest() {
        LoginRequest req = new LoginRequest();
        req.setEmail("cust@sole.test");
        req.setPassword("Secret123!");
        return req;
    }

    private User activeCustomer() {
        return User.builder()
                .userId("u-cust-1")
                .email("cust@sole.test")
                .fullName("Customer")
                .password("encoded-pw")
                .role(UserRole.CUSTOMER)
                .authType(AuthProviderType.LOCAL)
                .isEmailVerified(true)
                .isActive(true)
                .enabled(true)
                .build();
    }
}
