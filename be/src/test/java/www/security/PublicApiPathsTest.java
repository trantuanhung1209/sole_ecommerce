package www.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicApiPathsTest {

    @Test
    void catalogAndCartPathsArePublic() {
        assertTrue(isPublic("GET", "/products"));
        assertTrue(isPublic("GET", "/products?page=0"));
        assertTrue(isPublic("GET", "/brands"));
        assertTrue(isPublic("GET", "/categories"));
        assertTrue(isPublic("GET", "/reviews"));
        assertTrue(isPublic("GET", "/reviews/home"));
        assertTrue(isPublic("GET", "/reviews/product/123"));
        assertTrue(isPublic("GET", "/reviews/products/123"));
        assertTrue(isPublic("GET", "/cart"));
        assertTrue(isPublic("POST", "/cart/items"));
        assertTrue(isPublic("POST", "/ai/chat"));
        assertTrue(isPublic("POST", "/ai/chat/voice"));
        assertTrue(isPublic("POST", "/ai/chat/image"));
    }

    @Test
    void protectedPathsAreNotPublic() {
        assertFalse(isPublic("GET", "/orders/my-orders"));
        assertFalse(isPublic("GET", "/checkout/preview"));
        assertFalse(isPublic("GET", "/reviews/me"));
        assertFalse(isPublic("GET", "/reviews/me?page=0&size=20"));
        assertFalse(isPublic("GET", "/reviews/me/"));
        assertFalse(isPublic("GET", "/reviewsfoo"));
        assertFalse(isPublic("POST", "/reviews/products"));
        assertFalse(isPublic("PUT", "/reviews/123"));
        assertFalse(isPublic("DELETE", "/reviews/123"));
    }

    @Test
    void onlyActuatorHealthEndpointsArePublic() {
        assertTrue(isPublic("GET", "/actuator/health"));
        assertTrue(isPublic("GET", "/actuator/health/"));
        assertTrue(isPublic("GET", "/actuator/health/liveness"));
        assertTrue(isPublic("GET", "/actuator/health/readiness"));

        assertFalse(isPublic("GET", "/actuator"));
        assertFalse(isPublic("GET", "/actuator/"));
        assertFalse(isPublic("GET", "/actuator/info"));
        assertFalse(isPublic("GET", "/actuator/env"));
        assertFalse(isPublic("GET", "/actuator/metrics"));
        assertFalse(isPublic("GET", "/actuator/healthfoo"));
        assertFalse(isPublic("POST", "/actuator/health"));
    }

    @Test
    void optionalAuthAppliesOnlyToCartAndAiChatEndpoints() {
        assertTrue(allowsOptionalAuth("GET", "/cart"));
        assertTrue(allowsOptionalAuth("GET", "/cart/"));
        assertTrue(allowsOptionalAuth("POST", "/cart/items"));
        assertTrue(allowsOptionalAuth("DELETE", "/cart/items/123"));
        assertTrue(allowsOptionalAuth("POST", "/ai/chat"));
        assertTrue(allowsOptionalAuth("POST", "/ai/chat/voice"));
        assertTrue(allowsOptionalAuth("POST", "/ai/chat/image"));

        assertFalse(allowsOptionalAuth("GET", "/ai/chat"));
        assertFalse(allowsOptionalAuth("GET", "/cartfoo"));
        assertFalse(isPublic("GET", "/cartfoo"));
        assertFalse(allowsOptionalAuth("GET", "/products"));
        assertFalse(allowsOptionalAuth("POST", "/auth/login"));
        assertFalse(allowsOptionalAuth("GET", "/orders/my-orders"));
        assertFalse(allowsOptionalAuth("GET", "/ai/conversations"));

        MockHttpServletRequest uriFallback = new MockHttpServletRequest("GET", "/api/cart");
        uriFallback.setServletPath("");
        uriFallback.setContextPath("/api");
        assertTrue(PublicApiPaths.isPublic(uriFallback));
        assertTrue(PublicApiPaths.allowsOptionalAuth(uriFallback));
    }

    private static boolean allowsOptionalAuth(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setServletPath(uri);
        request.setContextPath("/api");
        return PublicApiPaths.allowsOptionalAuth(request);
    }

    private static boolean isPublic(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setServletPath(uri);
        request.setContextPath("/api");
        return PublicApiPaths.isPublic(request);
    }
}
