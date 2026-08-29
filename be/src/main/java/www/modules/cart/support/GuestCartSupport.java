package www.modules.cart.support;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class GuestCartSupport {
    public static final String COOKIE_NAME = "guest_cart";
    public static final String HEADER_NAME = "X-Guest-Cart-Id";

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    public String resolveGuestSessionId(HttpServletRequest request) {
        String header = request.getHeader(HEADER_NAME);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (COOKIE_NAME.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public String ensureGuestSessionId(HttpServletRequest request, HttpServletResponse response) {
        String existing = resolveGuestSessionId(request);
        if (existing != null) {
            return existing;
        }
        String guestId = UUID.randomUUID().toString();
        Cookie cookie = new Cookie(COOKIE_NAME, guestId);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(60 * 60 * 24 * 30);
        response.addCookie(cookie);
        return guestId;
    }
}
