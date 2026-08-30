package www.modules.payments.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import www.config.SePayProperties;
import www.exception.ForbiddenException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@RequiredArgsConstructor
@Slf4j
public class SePayIpnVerifier {
    private static final long MAX_TIMESTAMP_SKEW_SECONDS = 300;

    private final SePayProperties sepayProperties;
    private final ObjectMapper objectMapper;

    public void verify(HttpServletRequest request, String rawBody) {
        if (!sepayProperties.isIpnVerify()) {
            log.warn("SePay IPN verification disabled (sepay.ipn-verify=false)");
            return;
        }

        String secret = normalizeSecret(sepayProperties.getSecretKey());
        if (secret == null) {
            log.warn("SEPAY_SECRET_KEY is empty — accepting IPN without authentication");
            return;
        }

        String headerSecret = normalizeSecret(request.getHeader("X-Secret-Key"));
        if (headerSecret != null && constantTimeEquals(secret, headerSecret)) {
            return;
        }

        String signature = request.getHeader("X-SePay-Signature");
        if (signature != null && rawBody != null && verifySignature(secret, signature, request, rawBody)) {
            return;
        }

        if (headerSecret == null && signature == null && isSandbox()) {
            log.warn("SePay sandbox IPN has no auth headers — accepted. Enable SECRET_KEY auth before production.");
            return;
        }

        if (headerSecret != null) {
            throw new ForbiddenException(
                    "Invalid SePay IPN authentication: X-Secret-Key does not match SEPAY_SECRET_KEY");
        }
        if (signature != null) {
            throw new ForbiddenException(
                    "Invalid SePay IPN authentication: HMAC signature verification failed");
        }
        throw new ForbiddenException(
                "Invalid SePay IPN authentication: missing X-Secret-Key (enable SECRET_KEY auth in SePay Dashboard)");
    }

    private boolean isSandbox() {
        return "sandbox".equalsIgnoreCase(sepayProperties.getEnvironment());
    }

    private boolean verifySignature(String secret, String signature, HttpServletRequest request, String rawBody) {
        for (String timestamp : candidateTimestamps(request, rawBody)) {
            long epochSeconds;
            try {
                epochSeconds = Long.parseLong(timestamp);
            } catch (NumberFormatException e) {
                continue;
            }
            long now = System.currentTimeMillis() / 1000;
            if (Math.abs(now - epochSeconds) > MAX_TIMESTAMP_SKEW_SECONDS) {
                continue;
            }

            String payload = timestamp + "." + rawBody;
            String expectedPrefixed = "sha256=" + hmacSha256Hex(secret, payload);
            if (matchesSignature(signature, expectedPrefixed, hmacSha256Hex(secret, payload))) {
                return true;
            }
        }
        return false;
    }

    private String[] candidateTimestamps(HttpServletRequest request, String rawBody) {
        String headerTimestamp = request.getHeader("X-SePay-Timestamp");
        String bodyTimestamp = extractBodyTimestamp(rawBody);
        if (headerTimestamp != null && bodyTimestamp != null) {
            return new String[] { headerTimestamp.trim(), bodyTimestamp.trim() };
        }
        if (headerTimestamp != null) {
            return new String[] { headerTimestamp.trim() };
        }
        if (bodyTimestamp != null) {
            return new String[] { bodyTimestamp.trim() };
        }
        return new String[0];
    }

    private String extractBodyTimestamp(String rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            JsonNode timestamp = root.get("timestamp");
            if (timestamp != null && !timestamp.isNull()) {
                return timestamp.asText();
            }
        } catch (Exception ignored) {
            // ignore malformed body here; controller validates payload separately
        }
        return null;
    }

    private boolean matchesSignature(String actual, String expectedPrefixed, String expectedRawHex) {
        return constantTimeEquals(actual, expectedPrefixed)
                || constantTimeEquals(actual, expectedRawHex)
                || constantTimeEquals(stripSha256Prefix(actual), expectedRawHex);
    }

    private String stripSha256Prefix(String signature) {
        if (signature != null && signature.startsWith("sha256=")) {
            return signature.substring("sha256=".length());
        }
        return signature;
    }

    private String normalizeSecret(String secret) {
        if (secret == null) {
            return null;
        }
        String trimmed = secret.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String hmacSha256Hex(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new ForbiddenException("Unable to verify SePay signature");
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8));
    }
}
