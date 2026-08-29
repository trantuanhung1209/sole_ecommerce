package www.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CoopHeaderFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Set Cross-Origin-Opener-Policy to unsafe-none to allow postMessage from Google OAuth popup
        httpResponse.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
        
        chain.doFilter(request, response);
    }
}
