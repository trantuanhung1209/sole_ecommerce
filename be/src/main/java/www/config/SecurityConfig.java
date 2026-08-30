package www.config;

import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import www.security.RateLimitFilter;
import www.security.SpaCsrfTokenRequestHandler;
import www.security.JwtAccessDeniedHandler;
import www.security.JwtAuthenticationEntryPoint;
import www.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final Environment environment;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");
        CsrfTokenRequestAttributeHandler requestHandler = new SpaCsrfTokenRequestHandler();
        requestHandler.setCsrfRequestAttributeName("_csrf");
        boolean swaggerPublic = !java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod");

        http.cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/payments/sepay/callback",
                    "/auth/register", "/auth/verify-otp", "/auth/login", "/auth/refresh",
                    "/auth/forgot-password", "/auth/reset-password", "/auth/google",
                    "/ai/chat"))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)
            )
            .authorizeHttpRequests(authz -> {
                authz.dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll();
                authz.requestMatchers(HttpMethod.POST,
                    "/auth/register", "/auth/verify-otp", "/auth/login", "/auth/refresh",
                    "/auth/forgot-password", "/auth/reset-password", "/auth/google").permitAll();
                authz.requestMatchers(HttpMethod.GET, "/actuator/**").permitAll();
                if (swaggerPublic) {
                    authz.requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                }
                authz.requestMatchers(HttpMethod.GET, "/products/**", "/brands/**", "/categories/**").permitAll();
                authz.requestMatchers(HttpMethod.GET, "/reviews/**").permitAll();
                authz.requestMatchers(HttpMethod.POST, "/ai/chat").permitAll();
                authz.requestMatchers("/cart/**").permitAll();
                authz.requestMatchers(HttpMethod.GET, "/payments/sepay/callback").permitAll();
                authz.requestMatchers(HttpMethod.POST, "/payments/sepay/callback").permitAll();
                authz.requestMatchers("/checkout/**", "/orders/**", "/payments/order/**",
                    "/payments/*", "/ai/conversations/**", "/wishlist/**", "/returns/**", "/addresses/**",
                    "/auth/sessions/**", "/notifications/**", "/promotions/validate", "/media/**").authenticated();
                authz.requestMatchers(HttpMethod.POST, "/reviews/products").authenticated();
                authz.requestMatchers(HttpMethod.PUT, "/reviews/**").authenticated();
                authz.requestMatchers(HttpMethod.DELETE, "/reviews/**").authenticated();
                authz.requestMatchers("/admin/role-permissions/**", "/admin/roles/**",
                    "/admin/permissions/**", "/admin/audit-logs").hasRole("SUPER_ADMIN");
                authz.requestMatchers("/admin/reports/**").hasAnyRole("SHOP_MANAGER", "ADMIN", "SUPER_ADMIN");
                authz.requestMatchers("/admin/products/**", "/admin/brands/**", "/admin/categories/**",
                    "/admin/catalog/**", "/admin/inventory/**", "/admin/orders/**", "/admin/reviews/**",
                    "/admin/returns/**", "/admin/promotions/**")
                    .hasAnyRole("ADMIN", "STAFF", "SHOP_MANAGER", "SUPER_ADMIN");
                authz.requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN");
                authz.anyRequest().authenticated();
            })
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
