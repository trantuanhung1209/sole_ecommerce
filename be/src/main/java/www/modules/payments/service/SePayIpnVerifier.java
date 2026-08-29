package www.modules.payments.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import www.config.SePayProperties;
import www.exception.ForbiddenException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@RequiredArgsConstructor
public class SePayIpnVerifier {
    private static final long MAX_TIMESTAMP_SKEW_SECONDS = 300;

    private final SePayProperties sepayProperties;

    public void verify(HttpServletRequest request, String rawBody) {
        String secret = sepayProperties.getSecretKey();
        if (secret == null || secret.isBlank()) {
            return;
        }

        String headerSecret = request.getHeader("X-Secret-Key");
        if (headerSecret != null && constantTimeEquals(secret, headerSecret)) {
            return;
        }

        String signature = request.getHeader("X-SePay-Signature");
        String timestampHeader = request.getHeader("X-SePay-Timestamp");
        if (signature != null && timestampHeader != null && rawBody != null) {
            long timestamp;
            try {
                timestamp = Long.parseLong(timestampHeader);
            } catch (NumberFormatException e) {
                throw new ForbiddenException("Invalid SePay timestamp");
            }
            long now = System.currentTimeMillis() / 1000;
            if (Math.abs(now - timestamp) > MAX_TIMESTAMP_SKEW_SECONDS) {
                throw new ForbiddenException("SePay request expired");
            }
            String expected = "sha256=" + hmacSha256Hex(secret, timestampHeader + "." + rawBody);
            if (constantTimeEquals(expected, signature)) {
                return;
            }
        }

        throw new ForbiddenException("Invalid SePay IPN authentication");
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
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8));
    }
}
