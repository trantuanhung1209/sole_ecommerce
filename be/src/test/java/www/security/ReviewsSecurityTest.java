package www.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;
import www.config.SecurityConfig;
import www.model.entity.User;
import www.model.enums.UserRole;
import www.modules.reviews.controller.ProductReviewController;
import www.modules.reviews.dto.ProductReviewDtos.HomeReviewsResponse;
import www.modules.reviews.service.ProductReviewService;
import www.service.interfaces.SessionService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductReviewController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        JwtAccessDeniedHandler.class,
        RateLimitFilter.class
})
class ReviewsSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductReviewService reviewService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private SessionService sessionService;

    @MockitoBean
    private StringRedisTemplate stringRedisTemplate;

    @MockitoBean
    private CorsConfigurationSource corsConfigurationSource;

    @Test
    void unauthenticatedGetMyReviewsReturns401WithoutHittingController() throws Exception {
        mockMvc.perform(get("/reviews/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Yêu cầu xác thực"));

        verify(reviewService, never()).myReviews(any(), any());
    }

    @Test
    void staleCookieOnGetMyReviewsReturns401() throws Exception {
        when(sessionService.validateAccessToken("stale-jwt")).thenReturn(false);

        mockMvc.perform(get("/reviews/me")
                        .cookie(new Cookie("access_token", "stale-jwt")))
                .andExpect(status().isUnauthorized());

        verify(reviewService, never()).myReviews(any(), any());
    }

    @Test
    void authenticatedGetMyReviewsPopulatesUserPrincipalAndReturns200() throws Exception {
        User customer = User.builder()
                .userId("u-cust-1")
                .email("customer@sole.test")
                .fullName("Customer Demo")
                .role(UserRole.CUSTOMER)
                .enabled(true)
                .build();
        when(sessionService.validateAccessToken("valid-jwt")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("valid-jwt")).thenReturn("u-cust-1");
        when(customUserDetailsService.loadUserById("u-cust-1"))
                .thenReturn(CustomUserDetailsService.UserPrincipal.create(customer));
        when(reviewService.myReviews(eq("u-cust-1"), eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        mockMvc.perform(get("/reviews/me")
                        .cookie(new Cookie("access_token", "valid-jwt")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content").isArray());

        verify(reviewService).myReviews(eq("u-cust-1"), eq(PageRequest.of(0, 20)));
    }

    @Test
    void publicReviewEndpointsRemainAccessibleWithoutAuth() throws Exception {
        when(reviewService.browsePublic(any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 12), 0));
        when(reviewService.homeReviews(4))
                .thenReturn(HomeReviewsResponse.builder().averageRating(5.0).totalReviews(0).build());
        when(reviewService.productReviews(eq("prod-123"), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/reviews"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/reviews/home"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/reviews/products/prod-123"))
                .andExpect(status().isOk());
    }
}
