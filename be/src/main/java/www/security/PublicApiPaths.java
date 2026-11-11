package www.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;

/**
 * Paths that must stay public (no JWT required).
 * Used by SecurityConfig and JwtAuthenticationFilter so stale cookies cannot block guest access.
 */
public final class PublicApiPaths {
    private PublicApiPaths() {}

    public static String normalizePath(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path == null || path.isBlank()) {
            path = request.getRequestURI();
            String contextPath = request.getContextPath();
            if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
                path = path.substring(contextPath.length());
            }
        }
        if (path.isEmpty()) {
            return "/";
        }
        int query = path.indexOf('?');
        if (query >= 0) {
            path = path.substring(0, query);
        }
        return path;
    }

    public static boolean isPublic(HttpServletRequest request) {
        String method = request.getMethod();
        String path = normalizePath(request);

        if (HttpMethod.GET.matches(method)) {
            if (isCatalogRead(path) || isPublicReviewRead(path)) {
                return true;
            }
            if (isActuatorHealthPath(path)) {
                return true;
            }
            if (path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui") || path.equals("/swagger-ui.html")) {
                return true;
            }
            if (path.startsWith("/payments/sepay/callback")) {
                return true;
            }
        }

        if (isCartPath(path)) {
            return true;
        }

        if (HttpMethod.POST.matches(method)) {
            if (isAiChatPath(path) || path.startsWith("/payments/sepay/callback")) {
                return true;
            }
            if (isAuthPost(path)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Public routes that behave differently when a user is signed in (e.g. user cart vs guest cart,
     * saved AI history vs guest chat). {@link JwtAuthenticationFilter} runs on these paths to parse
     * valid cookies while still allowing guests/stale cookies through.
     */
    public static boolean allowsOptionalAuth(HttpServletRequest request) {
        String method = request.getMethod();
        String path = normalizePath(request);
        if (isCartPath(path)) {
            return true;
        }
        return HttpMethod.POST.matches(method) && isAiChatPath(path);
    }

    private static boolean isActuatorHealthPath(String path) {
        return path.equals("/actuator/health") || path.startsWith("/actuator/health/");
    }

    private static boolean isCartPath(String path) {
        return path.equals("/cart") || path.startsWith("/cart/");
    }

    private static boolean isAiChatPath(String path) {
        return path.equals("/ai/chat")
                || path.equals("/ai/chat/voice")
                || path.equals("/ai/chat/image");
    }

    private static boolean isCatalogRead(String path) {
        return path.equals("/products") || path.startsWith("/products/")
                || path.equals("/brands") || path.startsWith("/brands/")
                || path.equals("/categories") || path.startsWith("/categories/");
    }

    private static boolean isPublicReviewRead(String path) {
        if (path.equals("/reviews/me") || path.startsWith("/reviews/me/")) {
            return false;
        }
        return path.equals("/reviews") || path.startsWith("/reviews/");
    }

    private static boolean isAuthPost(String path) {
        return path.equals("/auth/register")
                || path.equals("/auth/verify-otp")
                || path.equals("/auth/login")
                || path.equals("/auth/refresh")
                || path.equals("/auth/forgot-password")
                || path.equals("/auth/reset-password")
                || path.equals("/auth/google");
    }
}
