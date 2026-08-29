package www.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * SPA-friendly CSRF handler: keeps token in cookie and accepts header on mutating requests.
 */
public class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        csrfToken.get();
        super.handle(request, response, csrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String header = request.getHeader("X-XSRF-TOKEN");
        if (StringUtils.hasText(header)) {
            return header;
        }
        return super.resolveCsrfTokenValue(request, csrfToken);
    }
}
