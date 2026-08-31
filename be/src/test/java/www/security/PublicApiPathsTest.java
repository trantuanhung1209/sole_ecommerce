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
        assertTrue(isPublic("GET", "/reviews/home"));
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
    }

    private static boolean isPublic(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setServletPath(uri);
        request.setContextPath("/api");
        return PublicApiPaths.isPublic(request);
    }
}
