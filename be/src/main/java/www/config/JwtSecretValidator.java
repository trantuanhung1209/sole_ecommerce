package www.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class JwtSecretValidator {

    private static final int MIN_SECRET_BYTES = 32;

    private final JwtProperties jwtProperties;

    @jakarta.annotation.PostConstruct
    void validateSecretLength() {
        String secret = jwtProperties.getSecret();
        int length = secret == null ? 0 : secret.getBytes(StandardCharsets.UTF_8).length;
        if (length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET is too short (%d bytes). Use at least %d characters in .env "
                            .formatted(length, MIN_SECRET_BYTES));
        }
    }
}
