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
            if (isCatalogRead(path) || path.startsWith("/reviews")) {
                return true;
            }
            if (path.startsWith("/actuator")) {
                return true;
            }
            if (path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui") || path.equals("/swagger-ui.html")) {
                return true;
            }
            if (path.startsWith("/payments/sepay/callback")) {
                return true;
            }
        }

        if (path.startsWith("/cart")) {
            return true;
        }

        if (HttpMethod.POST.matches(method)) {
            if (path.equals("/ai/chat") || path.equals("/ai/chat/voice") || path.equals("/ai/chat/image")
                    || path.startsWith("/payments/sepay/callback")) {
                return true;
            }
            if (isAuthPost(path)) {
                return true;
            }
        }

        return false;
    }

    private static boolean isCatalogRead(String path) {
        return path.equals("/products") || path.startsWith("/products/")
                || path.equals("/brands") || path.startsWith("/brands/")
                || path.equals("/categories") || path.startsWith("/categories/");
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
