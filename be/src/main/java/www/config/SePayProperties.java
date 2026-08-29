package www.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "sepay")
public class SePayProperties {
    
    private String apiUrl; // Được load từ application.properties
    private String merchantId;
    private String secretKey;
    private String template = "compact";
    private String webhookUrl;
    private String ipnUrl;
    private String environment = "sandbox"; // sandbox hoặc production
    
    // Timeout settings
    private int connectTimeout = 30000; // 30 seconds
    private int readTimeout = 30000; // 30 seconds
}