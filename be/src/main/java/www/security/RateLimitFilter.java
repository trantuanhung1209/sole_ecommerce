package www.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import www.model.dto.response.ApiResponse;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/auth/login",
            "/auth/verify-otp",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/checkout",
            "/ai/chat",
            "/ai/chat/voice",
            "/ai/chat/image"
    );

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${rate-limit.window-minutes:15}")
    private long windowMinutes;

    @Value("${rate-limit.login-max:5}")
    private int loginMax;

    @Value("${rate-limit.otp-max:10}")
    private int otpMax;

    @Value("${rate-limit.checkout-max:10}")
    private int checkoutMax;

    @Value("${rate-limit.ai-chat-max:30}")
    private int aiChatMax;

    @Value("${rate-limit.ai-voice-max:10}")
    private int aiVoiceMax;

    @Value("${rate-limit.ai-image-max:10}")
    private int aiImageMax;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!enabled || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = normalizePath(request.getRequestURI());
        if (!LIMITED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        int max = maxForPath(path);
        String key = buildKey(request, path);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofMinutes(windowMinutes));
        }
        if (count != null && count > max) {
            writeTooManyRequests(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private int maxForPath(String path) {
        return switch (path) {
            case "/auth/login" -> loginMax;
            case "/checkout" -> checkoutMax;
            case "/ai/chat" -> aiChatMax;
            case "/ai/chat/voice" -> aiVoiceMax;
            case "/ai/chat/image" -> aiImageMax;
            default -> otpMax;
        };
    }

    private String buildKey(HttpServletRequest request, String path) {
        String ip = request.getRemoteAddr();
        String email = request.getParameter("email");
        if (email == null || email.isBlank()) {
            email = request.getHeader("X-RateLimit-Email");
        }
        if (email != null && !email.isBlank()) {
            return "rate:" + path + ":" + ip + ":" + email.toLowerCase();
        }
        return "rate:" + path + ":" + ip;
    }

    private String normalizePath(String uri) {
        if (uri == null) {
            return "";
        }
        String path = uri;
        if (path.startsWith("/api")) {
            path = path.substring(4);
        }
        if (path.endsWith("/") && path.length() > 1) {
            path = path.substring(0, path.length() - 1);
        }
        return path;
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.error("Too many requests. Please try again later."));
    }
}
