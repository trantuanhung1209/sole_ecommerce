package www.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiContextResult {
    private String contextText;
    @Builder.Default
    private List<AiDtos.SuggestedProduct> suggestedProducts = new ArrayList<>();
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
