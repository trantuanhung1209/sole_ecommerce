package www.modules.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class OpenAiChatResult {
    private String content;
    @Builder.Default
    private List<ToolCall> toolCalls = new ArrayList<>();

    public boolean hasToolCalls() {
        return toolCalls != null && !toolCalls.isEmpty();
    }
}
