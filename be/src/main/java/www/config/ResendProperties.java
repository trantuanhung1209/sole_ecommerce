package www.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "resend")
@Data
public class ResendProperties {
    private String apiKey;
    private String fromEmail = "SOLE <onboarding@resend.dev>";
}
