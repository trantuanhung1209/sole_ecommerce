package www.modules.ai.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ai_embeddings")
public class AiEmbedding {
    @Id
    private String id;
    @Indexed
    private AiEntityType entityType;
    @Indexed
    private String entityId;
    private String text;
    @Builder.Default
    private List<Double> embedding = new ArrayList<>();
    private LocalDateTime updatedAt;

    public static String compositeId(AiEntityType entityType, String entityId) {
        return entityType.name() + ":" + entityId;
    }
}
