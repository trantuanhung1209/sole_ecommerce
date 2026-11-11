package www.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import www.model.entity.User;
import www.model.enums.UserRole;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.service.interfaces.SessionService;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private SessionService sessionService;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        filter = new JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService, sessionService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void runsFilterOnOptionalAuthCartAndAiChatAndProtectedRoutesButSkipsPurePublicRoutes() {
        assertThat(filter.shouldNotFilter(req("GET", "/cart"))).isFalse();
        assertThat(filter.shouldNotFilter(req("POST", "/cart/items"))).isFalse();
        assertThat(filter.shouldNotFilter(req("POST", "/ai/chat"))).isFalse();
        assertThat(filter.shouldNotFilter(req("POST", "/ai/chat/voice"))).isFalse();
        assertThat(filter.shouldNotFilter(req("POST", "/ai/chat/image"))).isFalse();
        assertThat(filter.shouldNotFilter(req("GET", "/orders/my-orders"))).isFalse();

        assertThat(filter.shouldNotFilter(req("GET", "/products"))).isTrue();
        assertThat(filter.shouldNotFilter(req("POST", "/auth/login"))).isTrue();
        assertThat(filter.shouldNotFilter(req("GET", "/reviews/home"))).isTrue();
        assertThat(filter.shouldNotFilter(req("POST", "/payments/sepay/callback"))).isTrue();
    }

    @Test
    void authenticatesValidCookieOnCartEvenWhenGuestHeaderPresent() throws Exception {
        User user = User.builder()
                .userId("u-cust-1")
                .email("customer@sole.test")
                .fullName("Customer Demo")
                .role(UserRole.CUSTOMER)
                .enabled(true)
                .build();
        UserPrincipal principal = (UserPrincipal) UserPrincipal.create(user);

        when(sessionService.validateAccessToken("valid-jwt")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("valid-jwt")).thenReturn("u-cust-1");
        when(customUserDetailsService.loadUserById("u-cust-1")).thenReturn(principal);

        MockHttpServletRequest request = req("GET", "/cart");
        request.setCookies(new Cookie("access_token", "valid-jwt"));
        request.addHeader("X-Guest-Cart-Id", "guest-uuid-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<Authentication> seenAuth = new AtomicReference<>();
        FilterChain chain = (req, res) -> seenAuth.set(SecurityContextHolder.getContext().getAuthentication());

        filter.doFilter(request, response, chain);

        assertThat(seenAuth.get()).isNotNull();
        assertThat(seenAuth.get().getPrincipal()).isInstanceOf(UserPrincipal.class);
        assertThat(((UserPrincipal) seenAuth.get().getPrincipal()).getId()).isEqualTo("u-cust-1");
    }

    @Test
    void authenticatesValidCookieOnAiChat() throws Exception {
        User user = User.builder()
                .userId("u-cust-1")
                .email("customer@sole.test")
                .role(UserRole.CUSTOMER)
                .enabled(true)
                .build();
        when(sessionService.validateAccessToken("valid-jwt")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("valid-jwt")).thenReturn("u-cust-1");
        when(customUserDetailsService.loadUserById("u-cust-1")).thenReturn(UserPrincipal.create(user));

        MockHttpServletRequest request = req("POST", "/ai/chat");
        request.setCookies(new Cookie("access_token", "valid-jwt"));
        AtomicReference<Authentication> seenAuth = new AtomicReference<>();

        filter.doFilter(request, new MockHttpServletResponse(),
                (req, res) -> seenAuth.set(SecurityContextHolder.getContext().getAuthentication()));

        assertThat(seenAuth.get()).isNotNull();
        assertThat(((UserPrincipal) seenAuth.get().getPrincipal()).getId()).isEqualTo("u-cust-1");
    }

    @Test
    void allowsGuestAndStaleCookieOnCartWithoutAuthenticatingOrThrowing() throws Exception {
        MockHttpServletRequest guestReq = req("GET", "/cart");
        AtomicReference<Authentication> guestAuth = new AtomicReference<>();
        filter.doFilter(guestReq, new MockHttpServletResponse(),
                (req, res) -> guestAuth.set(SecurityContextHolder.getContext().getAuthentication()));
        assertThat(guestAuth.get()).isNull();

        when(sessionService.validateAccessToken("stale-jwt")).thenReturn(false);
        MockHttpServletRequest staleReq = req("GET", "/cart");
        staleReq.setCookies(new Cookie("access_token", "stale-jwt"));
        MockHttpServletResponse staleRes = new MockHttpServletResponse();
        AtomicReference<Authentication> staleAuth = new AtomicReference<>();
        filter.doFilter(staleReq, staleRes,
                (req, res) -> staleAuth.set(SecurityContextHolder.getContext().getAuthentication()));
        assertThat(staleAuth.get()).isNull();
        assertThat(staleRes.getStatus()).isEqualTo(200);
    }

    @Test
    void clearsContextWhenTokenParsingThrowsOnOptionalAuthOrProtectedRoute() throws Exception {
        when(sessionService.validateAccessToken("bad-jwt")).thenThrow(new RuntimeException("malformed"));

        MockHttpServletRequest cartReq = req("GET", "/cart");
        cartReq.setCookies(new Cookie("access_token", "bad-jwt"));
        AtomicReference<Authentication> cartAuth = new AtomicReference<>();
        filter.doFilter(cartReq, new MockHttpServletResponse(),
                (req, res) -> cartAuth.set(SecurityContextHolder.getContext().getAuthentication()));
        assertThat(cartAuth.get()).isNull();

        MockHttpServletRequest orderReq = req("GET", "/orders/my-orders");
        orderReq.setCookies(new Cookie("access_token", "bad-jwt"));
        AtomicReference<Authentication> orderAuth = new AtomicReference<>();
        filter.doFilter(orderReq, new MockHttpServletResponse(),
                (req, res) -> orderAuth.set(SecurityContextHolder.getContext().getAuthentication()));
        assertThat(orderAuth.get()).isNull();
    }

    @Test
    void rejectsDisabledUserAndHandlesBlankCookieOnCart() throws Exception {
        User disabled = User.builder()
                .userId("u-disabled")
                .email("disabled@sole.test")
                .role(UserRole.CUSTOMER)
                .enabled(false)
                .build();
        when(sessionService.validateAccessToken("disabled-jwt")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("disabled-jwt")).thenReturn("u-disabled");
        when(customUserDetailsService.loadUserById("u-disabled")).thenReturn(UserPrincipal.create(disabled));

        MockHttpServletRequest disabledReq = req("GET", "/cart/");
        disabledReq.setCookies(new Cookie("access_token", "disabled-jwt"));
        AtomicReference<Authentication> disabledAuth = new AtomicReference<>();
        filter.doFilter(disabledReq, new MockHttpServletResponse(),
                (req, res) -> disabledAuth.set(SecurityContextHolder.getContext().getAuthentication()));
        assertThat(disabledAuth.get()).isNull();

        MockHttpServletRequest blankReq = req("GET", "/cart");
        blankReq.setCookies(new Cookie("access_token", ""));
        AtomicReference<Authentication> blankAuth = new AtomicReference<>();
        filter.doFilter(blankReq, new MockHttpServletResponse(),
                (req, res) -> blankAuth.set(SecurityContextHolder.getContext().getAuthentication()));
        assertThat(blankAuth.get()).isNull();
    }

    private static MockHttpServletRequest req(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setServletPath(uri);
        request.setContextPath("/api");
        return request;
    }
}
