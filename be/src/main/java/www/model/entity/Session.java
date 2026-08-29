package www.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    private String sessionId;
    private String userId;
    private String refreshToken;
    private String accessToken;
    private String userAgent;
    private String ip;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}