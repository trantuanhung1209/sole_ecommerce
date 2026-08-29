package www.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger HTTP_LOG = LoggerFactory.getLogger("www.http");

    private final Set<String> skipPathPrefixes;

    public RequestLoggingFilter(
            @Value("${logging.http.skip-paths:/api/actuator/health,/api/actuator/info}") String skipPaths) {
        this.skipPathPrefixes = Arrays.stream(skipPaths.split(","))
                .map(String::trim)
                .filter(path -> !path.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!request.getRequestURI().startsWith("/api")) {
            return true;
        }
        String path = request.getRequestURI();
        return skipPathPrefixes.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("requestId", requestId);

        long startedAt = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            logRequest(request, response, System.currentTimeMillis() - startedAt);
            MDC.remove("requestId");
        }
    }

    private void logRequest(HttpServletRequest request, HttpServletResponse response, long durationMs) {
        String method = request.getMethod();
        String uri = buildUriWithQuery(request);
        int status = response.getStatus();
        String client = resolveClientIp(request);

        String message = String.format("%-6s %-48s -> %3d (%dms) [%s]",
                method, truncate(uri, 48), status, durationMs, client);

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR.value()) {
            HTTP_LOG.error(message);
        } else if (status >= HttpStatus.BAD_REQUEST.value()) {
            HTTP_LOG.warn(message);
        } else {
            HTTP_LOG.info(message);
        }
    }

    private static String buildUriWithQuery(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        if (query == null || query.isBlank()) {
            return uri;
        }
        return uri + "?" + query;
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }
}
