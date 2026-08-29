package www.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SessionResponse {
    private String sessionId;
    private String userAgent;
    private String ip;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean current;
}
