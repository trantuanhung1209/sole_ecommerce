package www.modules.payments;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import www.config.SePayProperties;
import www.exception.ForbiddenException;
import www.modules.payments.service.SePayIpnVerifier;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SePayIpnVerifierTest {

    private SePayProperties properties;
    private SePayIpnVerifier verifier;

    @BeforeEach
    void setUp() {
        properties = new SePayProperties();
        properties.setSecretKey("sandbox-secret");
        properties.setIpnVerify(true);
        verifier = new SePayIpnVerifier(properties, new ObjectMapper());
    }

    @Test
    void verify_acceptsMatchingSecretKeyHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Secret-Key", "sandbox-secret");

        assertDoesNotThrow(() -> verifier.verify(request, "{\"notification_type\":\"ORDER_PAID\"}"));
    }

    @Test
    void verify_rejectsWrongSecretKeyHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Secret-Key", "wrong-secret");

        assertThrows(ForbiddenException.class,
                () -> verifier.verify(request, "{\"notification_type\":\"ORDER_PAID\"}"));
    }

    @Test
    void verify_skipsWhenDisabled() {
        properties.setIpnVerify(false);
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertDoesNotThrow(() -> verifier.verify(request, "{}"));
    }

    @Test
    void verify_acceptsHmacSignatureUsingBodyTimestamp() throws Exception {
        long now = System.currentTimeMillis() / 1000;
        String body = "{\"timestamp\":" + now + ",\"notification_type\":\"ORDER_PAID\"}";
        MockHttpServletRequest request = new MockHttpServletRequest();
        String payload = now + "." + body;
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("sandbox-secret".getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload.getBytes());
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        request.addHeader("X-SePay-Signature", "sha256=" + hex);
        request.addHeader("X-SePay-Timestamp", String.valueOf(now));

        assertDoesNotThrow(() -> verifier.verify(request, body));
    }

    @Test
    void verify_acceptsSandboxIpnWithoutAuthHeaders() {
        properties.setEnvironment("sandbox");
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertDoesNotThrow(() -> verifier.verify(request, "{\"notification_type\":\"ORDER_PAID\"}"));
    }

    @Test
    void verify_rejectsProductionIpnWithoutAuthHeaders() {
        properties.setEnvironment("production");
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThrows(ForbiddenException.class,
                () -> verifier.verify(request, "{\"notification_type\":\"ORDER_PAID\"}"));
    }

    @Test
    void verify_rejectsProductionIpnWhenSecretKeyIsBlank() {
        properties.setEnvironment("production");
        properties.setSecretKey("   ");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Secret-Key", "   ");

        assertThrows(ForbiddenException.class,
                () -> verifier.verify(request, "{\"notification_type\":\"ORDER_PAID\"}"));

        properties.setSecretKey(null);
        assertThrows(ForbiddenException.class,
                () -> verifier.verify(new MockHttpServletRequest(), "{\"notification_type\":\"ORDER_PAID\"}"));
    }

    @Test
    void validateProductionConfiguration_throwsWhenProdProfileHasIpnVerifyFalse() {
        properties.setEnvironment("production");
        properties.setSecretKey("prod-secret");
        properties.setIpnVerify(false);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        SePayIpnVerifier prodVerifier = new SePayIpnVerifier(properties, new ObjectMapper(), env);

        assertThrows(IllegalStateException.class, prodVerifier::validateProductionConfiguration);
    }

    @Test
    void validateProductionConfiguration_throwsWhenProdProfileHasSandboxEnvironment() {
        properties.setEnvironment("sandbox");
        properties.setSecretKey("prod-secret");
        properties.setIpnVerify(true);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        SePayIpnVerifier prodVerifier = new SePayIpnVerifier(properties, new ObjectMapper(), env);

        assertThrows(IllegalStateException.class, prodVerifier::validateProductionConfiguration);
    }

    @Test
    void validateProductionConfiguration_throwsWhenProdProfileHasBlankSecretKey() {
        properties.setEnvironment("production");
        properties.setSecretKey("   ");
        properties.setIpnVerify(true);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        SePayIpnVerifier prodVerifier = new SePayIpnVerifier(properties, new ObjectMapper(), env);

        assertThrows(IllegalStateException.class, prodVerifier::validateProductionConfiguration);
    }

    @Test
    void validateProductionConfiguration_succeedsWhenProdProfileIsValid() {
        properties.setEnvironment("production");
        properties.setSecretKey("prod-secret");
        properties.setIpnVerify(true);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        SePayIpnVerifier prodVerifier = new SePayIpnVerifier(properties, new ObjectMapper(), env);

        assertDoesNotThrow(prodVerifier::validateProductionConfiguration);
    }

    @Test
    void validateProductionConfiguration_skipsWhenNoEnvironmentOrNonProdProfile() {
        properties.setEnvironment("sandbox");
        properties.setSecretKey("");
        properties.setIpnVerify(false);

        assertDoesNotThrow(() -> verifier.validateProductionConfiguration());

        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");
        SePayIpnVerifier devVerifier = new SePayIpnVerifier(properties, new ObjectMapper(), devEnv);

        assertDoesNotThrow(devVerifier::validateProductionConfiguration);
    }
}
