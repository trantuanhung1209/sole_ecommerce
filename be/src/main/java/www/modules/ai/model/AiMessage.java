package www.modules.ai.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessage {
    private String role;
    private String content;
    private String routeType;
    private LocalDateTime timestamp;
}
